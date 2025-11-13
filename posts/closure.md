---
title: "클로저란?"
date: "2025-03-01T13:33:27.982Z"
summary: "한 걸음 closure 내 맘"
tags: ["JavaScript"]
---

# 클로저(Closure)에 대하여

클로저는 자바스크립트에서 가장 중요한 개념 중 하나입니다. 함수가 자신이 생성되었을 때의 렉시컬 환경을 기억하는 메커니즘입니다.

## 클로저란 무엇인가?

클로저는 함수와 그 함수가 접근할 수 있는 스코프의 조합입니다. 함수가 반환되고 난 후에도, 그 함수는 자신의 렉시컬 스코프에 접근할 수 있습니다.

### 기본 예제

```typescript
function outer() {
  let count = 0;

  return function inner() {
    count++;
    return count;
  };
}

const counter = outer();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

위 예제에서 `inner` 함수는 `outer` 함수의 `count` 변수에 접근할 수 있습니다. 이것이 클로저입니다.

## 클로저의 특징

### 렉시컬 스코핑

클로저는 렉시컬 스코핑을 기반으로 합니다. 함수는 자신이 정의된 위치의 스코프에 접근합니다.

```javascript
let global = "global";

function outer() {
  let outerVar = "outer";

  function inner() {
    let innerVar = "inner";
    console.log(innerVar); // 'inner'
    console.log(outerVar); // 'outer'
    console.log(global); // 'global'
  }

  inner();
}

outer();
```

### 메모리 보존

클로저는 함수 내부의 변수를 보존합니다. 가비지 컬렉션의 대상이 되지 않습니다.

## 클로저의 활용 사례

### 1. 데이터 캡슐화

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance;

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount <= balance) {
        balance -= amount;
        return balance;
      }
      return "잔액 부족";
    },
    getBalance() {
      return balance;
    },
  };
}

const myAccount = createBankAccount(1000);
console.log(myAccount.deposit(500)); // 1500
console.log(myAccount.withdraw(200)); // 1300
console.log(myAccount.getBalance()); // 1300
```

### 2. 팩토리 패턴

```javascript
function makeAdder(x) {
  return function (y) {
    return x + y;
  };
}

const add5 = makeAdder(5);
const add10 = makeAdder(10);

console.log(add5(3)); // 8
console.log(add10(3)); // 13
```

### 3. 콜백과 이벤트 핸들러

```javascript
function setupButtons() {
  for (var i = 1; i <= 3; i++) {
    const button = document.createElement("button");
    button.textContent = `Button ${i}`;

    button.addEventListener(
      "click",
      (function (num) {
        return function () {
          console.log(`Button ${num} clicked`);
        };
      })(i)
    );

    document.body.appendChild(button);
  }
}
```

## 클로저와 성능

### 메모리 누수 위험

클로저는 메모리를 보존하므로, 불필요한 클로저가 많으면 메모리 누수가 발생할 수 있습니다.

```javascript
// 주의: 메모리 누수 가능성
function problematicClosure() {
  let largeData = new Array(1000000).fill("data");

  return function () {
    console.log("클로저가 largeData를 참조하고 있습니다.");
  };
}
```

## 클로저의 흔한 실수

### var와의 문제점

```javascript
// 문제 코드
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i); // 3, 3, 3
  }, 1000);
}

// 해결책 1: 클로저 활용
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(function () {
      console.log(j); // 0, 1, 2
    }, 1000);
  })(i);
}

// 해결책 2: let 사용
for (let i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i); // 0, 1, 2
  }, 1000);
}
```

## 결론

클로저는 자바스크립트의 강력한 기능으로, 데이터 캡슐화, 팩토리 패턴, 모듈 패턴 등에 널리 사용됩니다. 클로저를 제대로 이해하고 활용하면, 더욱 효율적이고 안전한 코드를 작성할 수 있습니다.

클로저는 복잡할 수 있지만, 꾸준한 학습과 연습을 통해 자연스럽게 익힐 수 있습니다.
