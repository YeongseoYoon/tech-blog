---
title: "이미지 변환 시 블로킹 해결하기 - Web Worker와 OffscreenCanvas"
date: "2025-10-10T10:42:22.881Z"
summary: "아 막지말라고"
tags: ["DEV"]
featured: true
---

`WebP`는 Google이 개발한 이미지 포맷으로, 웹 환경에 최적화된 무손실 및 손실 압축을 모두 지원합니다.

[Google 공식 문서](https://developers.google.com/speed/webp?hl=ko)에 따르면, WebP 무손실 이미지는 PNG 대비 26% 작고, WebP 손실 이미지는 동등한 SSIM 품질 지수에서 JPEG 대비 25~34% 더 작습니다.

2025년 현재 Chrome, Safari, Firefox, Edge, Opera 등 주요 브라우저에서 모두 지원하며, 전체 사용자의 약 95% 이상을 커버합니다.

## 🎆 WebP 형식으로 변환해보자

웹 사이트의 성능 최적화를 위해서, 업로드 하는 이미지의 형식을 WebP로 변환하는 기능을 만들었습니다.
이를 구현하려면 브라우저 API의 `Canvas API`를 사용해 스크립트 작성이 가능합니다.

```ts
export const convertImageToWebP = (
  file: File,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 1. 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일이 아닙니다."));
      return;
    }

    // 2. 이미 WebP인 경우 그대로 반환
    if (file.type === "image/webp") {
      resolve(file);
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 컨텍스트를 생성할 수 없습니다."));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(img.src);

            if (!blob) {
              reject(new Error("WebP 변환에 실패했습니다."));
              return;
            }

            const fileName = file.name.replace(/\.(jpe?g|png|gif)$/i, ".webp");
            const webpFile = new File([blob], fileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("이미지를 로드할 수 없습니다."));
    };

    img.src = URL.createObjectURL(file);
  });
};
```

위 코드의 과정을 이해해보자면 다음과 같습니다.

1. 업로드 된 파일을 브라우저가 이해할 수 있는 이미지 객체로 변환합니다.
2. 이미지의 픽셀 데이터를 Canvas에 복사합니다.
3. Canvas의 toBlob 메서드로 원하는 포맷(WebP)으로 인코딩합니다.

그런데 이 코드를 실행해보면, 문제가 발생할 수 있습니다.

## ✋ 이미지 변환시의 UI 블로킹 문제

만약 위 코드를 통해 고해상도 이미지나, 여러 장의 이미지를 변환한다고 가정해보겠습니다.

```ts
const largeFiles = Array.from(fileInput.files || []);

for (const file of largeFiles) {
  await convertImageToWebP(file, 0.8);
}
```

변환하는 동안은 유저가 다른 행동을 하지 못합니다.

### 🤔 왜 이런 일이 발생할까요?

자바스크립트는 `싱글 스레드` 언어입니다. 브라우저의 메인 스레드는 모든 작업을 혼자서 처리합니다.

<figure>
<img src="/static/images/메인-스레드.png" alt="메인 스레드" width={400} />
<figcaption>메인 스레드가 하는 일</figcaption>
</figure>

위 코드를 통해 이미지를 변환할때, Canvas에 이미지를 그리고 toBlob 메서드로 인코딩하는 과정을 메인 스레드에서 처리합니다.

```ts
ctx.drawImage(img, 0, 0);
canvas.toBlob(...);
```

해당 코드를 실행하는 동안, 메인 스레드가 블락되어 다른 모든 작업들이 대기 상태에 빠지게 됩니다.

## 💡 해결 방법

이 문제를 해결하는 핵심은 무거운 작업을 메인 스레드에서 분리하는 것입니다. `Web Worker`를 사용하면 가능합니다.

```ts
const worker = new Worker(new URL("./worker.js", import.meta.url));
```

Web Worker는 메인 스레드와 독립적으로 실행되는 백그라운드 스레드입니다. 메인 스레드와 별도로 작업을 처리할 수 있어 블로킹을 방지할 수 있습니다.

그러나 DOM에 직접 접근이 불가하고, document, window 객체에 접근할 수 없습니다.

```ts
self.onmessage = function (e) {
  // ❌ 에러 발생!
  const canvas = document.createElement("canvas");

  // Worker는 DOM이 없는 독립된 환경
  // document, window 모두 사용 불가
};
```

위 스크립트에서는 분명히 Canvas를 사용하여 WebP로 변환하겠다고 했는데, 어떻게하면 Web Worker에서 Canvas를 사용할 수 있을까요?

## 📝 OffscreenCanvas

`OffscreenCanvas`는 DOM과 Canvas API를 완전히 분리하여 Web Worker에서 렌더링을 가능하게 하는 웹 표준 API입니다. WHATWG HTML Living Standard에 정의된 이 기술은 Chrome의 RenderingNG 아키텍처의 핵심 기능이며, 2023년 3월부터 주요 브라우저에서 기본적으로 사용 가능합니다.

### Transferable 객체

OffscreenCanvas를 이해하려면 먼저 Transferable 객체의 개념을 알아야 합니다.
[WHATWG 사양](https://html.spec.whatwg.org/multipage/canvas.html#the-offscreencanvas-interface)에 따르면 OffscreenCanvas는 `Transferable` 인터페이스를 구현합니다.
이는 메인 스레드와 Worker 컨텍스트 모두에서 사용 가능하며, `복사 없이 소유권 이전(zero-copy transfer)`이 가능합니다. '복사 없이 소유권 이전'이라는 말은 어떤 의미일까요?

[MDN 문서](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)에서는 다음과 같이 정의합니다.

> Transferable objects are objects that own resources that can be transferred from one context to another, ensuring that the resources are only available in one context at a time. Following a transfer, the original object is no longer usable; it no longer points to the transferred resource, and any attempt to read or write the object will throw an exception.
>
> Transferable 객체는 한 컨텍스트에서 다른 컨텍스트로 전송할 수 있는 리소스를 소유한 객체입니다. 전송되면 원본 객체는 더 이상 사용할 수 없으며, 전송된 리소스를 더 이상 가리키지 않고, 객체를 읽거나 쓰려는 모든 시도는 예외를 발생시킵니다.

일반적인 데이터 전송은 `복사`가 발생합니다.

```ts
// 일반적인 데이터 전송 방식
const data = new Uint8Array(1024 * 1024 * 8); // 8MB
worker.postMessage(data); // 8MB가 복사되어 메모리 16MB 사용
```

하지만 Transferable 객체는 `소유권 이전(transfer)`을 사용합니다.

```ts
// 소유권 이전 방식
const data = new Uint8Array(1024 * 1024 * 8); // 8MB
worker.postMessage(data, [data.buffer]);
// 소유권만 이전, 메모리 8MB 사용

console.log(data.byteLength); // 0 - 더 이상 사용 불가!
```

이 메커니즘이 위에서 말한 `복사 없이 소유권 이전(zero-copy transfer)`방식으로, 대용량 데이터를 효율적으로 전송할 수 있게 합니다.

### Worker로의 전송

이제 OffscreenCanvas를 Worker에 전송하면 모든 렌더링 작업이 Worker 스레드에서 별도로 처리됩니다.

```ts
// Transferable Objects 사용
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

두 번째 매개변수 [offscreen]이 핵심입니다.
이는 transfer list로, 명시된 객체들의 소유권을 이전합니다.
전송 후 원본 OffscreenCanvas 객체는 더 이상 사용할 수 없게 되며, Worker가 독점적 소유권을 얻습니다.

이 과정에서 원본 Canvas는 `placeholder`가 되어 더 이상 직접 렌더링하지 않고, OffscreenCanvas가 생성한 프레임을 자동으로 표시합니다.

Canvas의 `placeholder`라는 개념이 생소할 수 있을 것 같은데요.
여기서의 `placeholder`는 원본 Canvas를 대신하여 사용되는 객체입니다.

WHATWG 사양에서는 Canvas의 context mode를 다음과 같이 정의합니다.

```
1. none: 컨텍스트가 없는 상태
2. 2d: 2D 컨텍스트
3. webgl: WebGL 컨텍스트
4. placeholder: OffscreenCanvas로 제어권을 넘긴 상태
```

이때 placeholder모드에서는 Canvas 요소 자체는 렌더링하지 않고, 연결된 OffscreenCanvas가 렌더링 됩니다.

쉽게 비유를 해보자면, 원본 Canvas는 TV 화면이고, OffscreenCanvas은 방송국으로 비유할 수 있습니다. 방송국에서 영상을 만들면 TV 화면이 자동으로 표시하는 것입니다.

### 렌더링 파이프라인

[Chrome RenderingNG 아키텍처](https://developer.chrome.com/docs/chromium/renderingng-architecture?hl=ko)에 따르면, 일반 Canvas와 OffscreenCanvas의 렌더링 방식은 근본적으로 다릅니다.

#### 일반 Canvas(메인 스레드)의 12단계 파이프라인

```
[메인 스레드 - DOM 의존적]
1. Animate    - 계산된 스타일 변경
2. Style      - CSS를 DOM에 적용
3. Layout     - 크기/위치 결정
4. Pre-paint  - 속성 트리 계산
5. Scroll     - 스크롤 오프셋 업데이트
6. Paint      - 디스플레이 목록 계산

[컴포지터 스레드]
7. Commit     - 컴포지터로 복사
8. Layerize   - 레이어로 분할

[GPU/Compositor]
9. Raster     - GPU 타일로 변환
10. Activate  - 컴포지터 프레임 생성
11. Aggregate - 모든 프레임 결합
12. Draw      - 화면에 픽셀 생성
```

모든 단계가 메인 스레드에 강하게 의존하며, JavaScript 실행으로 인한 지연이 전체 렌더링에 영향을 줍니다.

#### OffscreenCanvas(Worker 스레드)의 7단계 파이프라인

```
[Worker 스레드 - DOM 독립적]
1. Canvas 작업  - OffscreenCanvas에서 렌더링
2. convertToBlob 또는 commit

[컴포지터 스레드]
3. Layerize    - 레이어로 분할

[GPU/Compositor]
4. Raster      - GPU 타일로 변환
5. Activate    - 컴포지터 프레임 생성
6. Aggregate   - 모든 프레임 결합
7. Draw        - 화면에 픽셀 생성
```

이때는 기존 렌더링 파이프라인에서의 Animate(CSS 애니메이션이 없음), Style(CSS 스타일 계산 불필요), Layout(크기/위치 계산 불필요), Pre-paint(속성 트리 계산 불필요), Scroll(스크롤 오프셋 업데이트 불필요) 단계를 건너뜁니다.

[GoogleSource](https://chromium.googlesource.com/chromium/src/third_party/+/master/blink/renderer/modules/canvas/offscreencanvas/OffscreenCanvas-commit.md#placeholder-canvas-transferring-the-offscreencanvas-to-worker)에서 확인할 수 있듯이 OffscreenCanvas는 OffscreenCanvasFrameDispatcher라는 객체를 통해 CompositorFrame을 생성하고, mojo IPC 호출(CreateCompositorFrameSink(), SubmitCompositorFrame())을 통해 display compositor에 직접 제출합니다.

OffscreenCanvas는 `transferControlToOffscreen()`로 제어권을 넘긴 후, Worker에서 렌더링을 수행합니다.
Worker는 `requestAnimationFrame()`을 통해 vsync에 동기화되어 프레임을 생성하고, 이 프레임은 메인 스레드의 document lifecycle을 거치지 않고 display compositor로 직접 전송됩니다. 심지어 메인 스레드에서 사용하더라도, `transferControlToOffscreen()`를 호출하는 것만으로도 일반 페이지 합성과 "분리되어 있다"는 힌트를 줄 수 있습니다.

## 🚀 실제 구현

이제 실제로 구현해보겠습니다. 먼저 메인 스레드에서 동작할 코드를 작성해보겠습니다.

```ts
class ImageConverter {
  private worker: Worker;
  private pendingConversions: Map<number, any>;

  constructor() {
    this.worker = new Worker(
      new URL("./image-converter.worker.ts", import.meta.url)
    );
    this.pendingConversions = new Map();
    this.setupWorker();
  }

  setupWorker() {
    this.worker.onmessage = (e) => {
      const { type, blob, id, error } = e.data;
      const pending = this.pendingConversions.get(id);

      if (!pending) return;

      if (type === "success") {
        pending.resolve(blob);
      } else if (type === "error") {
        pending.reject(new Error(error));
      }

      this.pendingConversions.delete(id);
    };
  }

  async convertToWebP(file: File, quality = 0.9): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context 생성 실패"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const id = Date.now() + Math.random();
      this.pendingConversions.set(id, { resolve, reject });

      // Transferable Objects 사용
      this.worker.postMessage(
        {
          id,
          imageData: imageData.data.buffer,
          width: canvas.width,
          height: canvas.height,
          quality,
        },
        [imageData.data.buffer]
      ); // 위에 언급한 Transferable 방식으로 소유권 이전

      URL.revokeObjectURL(img.src);
    });
  }
}

const converter = new ImageConverter();

fileInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);

  // UI는 논블라킹
  for (const file of files) {
    try {
      const blob = await converter.convertToWebP(file, 0.9);
      console.log(`변환 완료: ${(blob.size / 1024).toFixed(2)}KB`);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.(jpg|jpeg|png)$/i, ".webp");
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("변환 실패:", error);
    }
  }
});
```

이제 Worker 스레드에서 동작할 코드를 작성해보겠습니다.

```ts
// image-converter.worker.ts
self.onmessage = async (e) => {
  const { id, imageData, width, height, quality } = e.data;

  try {
    // OffscreenCanvas 생성
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("OffscreenCanvas context 생성 실패");
    }

    // ImageData 복원
    const imgData = new ImageData(
      new Uint8ClampedArray(imageData),
      width,
      height
    );

    ctx.putImageData(imgData, 0, 0);

    // WebP로 변환
    const blob = await canvas.convertToBlob({
      type: "image/webp",
      quality: quality,
    });

    self.postMessage({ type: "success", id, blob });
  } catch (error) {
    self.postMessage({
      type: "error",
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
```

### 📌 동작 흐름 살펴보기

```
[메인 스레드]
1. 파일 선택
2. Image 로드 → Canvas → ImageData 추출
3. ImageData.buffer를 Transferable로 Worker에 전송
   ↓
4. 계속 UI 처리 (스크롤, 클릭 등) ✅

[Worker 스레드]
3. ImageData 수신 (소유권 획득)
4. OffscreenCanvas 생성
5. ImageData → Canvas
6. Canvas → WebP Blob (무거운 작업!)
7. Blob을 메인 스레드로 전송
   ↓

[메인 스레드]
8. Blob 수신
9. 다운로드 또는 업로드
```

핵심은 6번 단계(가장 무거운 작업)가 Worker에서 실행되어 메인 스레드가 자유롭다는 점입니다.

이미지 변환 같은 작업은 생각보다 브라우저에 꽤 부담을 주는 연산입니다. 특히 저처럼 고해상도 파일을 여러 장 한꺼번에 변환한다면, 메인 스레드가 잠시 멈춰버리면서 클릭도 안 되고 스크롤도 안 되는 순간이 생기게 되고, 유저에게는 서비스 장애처럼 느껴질 수도 있습니다.

이럴 때 Web Worker나 OffscreenCanvas를 활용하면, 무거운 연산을 메인 스레드와 분리해서 처리할 수 있습니다. UI는 계속 반응하도록 유지하면서, 변환 작업은 백그라운드에서 조용히 진행되는 구조입니다.

아직 모든 브라우저가 완벽히 지원하는 건 아니지만, OffscreenCanvas를 지원하지 않는 환경에서도 기존 canvas 코드를 그대로 재사용할 수 있어서 모듈화만 잘 해두면 대응도 어렵지 않을 것이라고 생각됩니다.

특히 캔버스를 이용한 인터랙티브 효과나 애니메이션이 많은 서비스라면 OffscreenCanvas 도입만으로도 눈에 띄게 매끄러운 사용자 경험을 만들 수 있으므로 지금 운영 중인 프로젝트에 캔버스가 있다면 한 번쯤 적용해보는 것도 꽤 흥미로울 것 같습니다.

### ✏️ 출처

https://developers.google.com/speed/webp?hl=ko<br/>
https://html.spec.whatwg.org/multipage/canvas.html#the-offscreencanvas-interface<br/>
https://developer.mozilla.org/ko/docs/Web/API/OffscreenCanvas<br/>
https://wiki.whatwg.org/wiki/OffscreenCanvas<br/>
https://web.dev/articles/offscreen-canvas?hl=ko<br/>
https://chromium.googlesource.com/chromium/src/third_party/+/master/blink/renderer/modules/canvas/offscreencanvas/OffscreenCanvas-commit.md<br/>
https://groups.google.com/a/chromium.org/g/graphics-dev/c/wRtDM-iVkms<br/>
