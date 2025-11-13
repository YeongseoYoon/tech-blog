"use client";

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
}

export default function TagFilter({
  tags,
  selectedTags,
  onTagChange,
}: TagFilterProps) {
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="mb-8" id="tags">
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">태그가 없습니다.</p>
        ) : (
          tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={
                selectedTags.includes(tag) ? "tag-filter" : "tag-inactive"
              }
            >
              #{tag}
            </button>
          ))
        )}
      </div>
      {selectedTags.length > 0 && (
        <button
          onClick={() => onTagChange([])}
          className="mt-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-semibold"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}
