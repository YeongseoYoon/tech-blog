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
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
        >
          <svg
            className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>필터 초기화</span>
        </button>
      )}
    </div>
  );
}
