"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogs, Blog } from "@/app/services/blogService";
import Image from "next/image";
import { FiCalendar } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Link from "next/link";

const BlogCardGrid: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const postsPerPage = 5;

  const {
    data: blogs,
    isLoading,
    isError,
    error,
  } = useQuery<Blog[], Error>({
    queryKey: ["blogs"],
    queryFn: fetchBlogs,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredBlogs = blogs?.filter(
    (blog) =>
      blog.authorName.toLowerCase().includes(searchTerm) ||
      blog.category.toLowerCase().includes(searchTerm) ||
      (blog.subCategory && blog.subCategory.toLowerCase().includes(searchTerm))
  );

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredBlogs?.slice(indexOfFirstPost, indexOfLastPost);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    toast.error(error.message || "Failed to fetch blogs");
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center">
        <strong>Error loading blogs!</strong>
        <p>{error?.message || "Unknown error occurred"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12">
        <h2 className="text-3xl font-bold text-center md:text-left text-gray-800">
          Latest Blog Posts
        </h2>
        <Link href="/blog">
          <button
            type="button"
            className="bg-blue-700 px-6 py-3 rounded-full text-white mt-4 md:mt-0 hover:bg-blue-800 transition-all"
          >
            Create and Update Blog
          </button>
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by author, category, or sub-category"
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentPosts?.map((blog) => (
          <div
            key={blog._id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-transform transform hover:-translate-y-1"
          >
            {blog.media?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
                {blog.media.map((mediaUrl, index) => (
                  <div
                    key={index}
                    className="relative h-48 w-full overflow-hidden"
                  >
                    <Image
                      src={mediaUrl}
                      alt={blog.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  {blog.category}
                </span>
                {blog.subCategory && (
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                    {blog.subCategory}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                {blog.title}
              </h3>
              <div className="flex items-center text-gray-500 text-sm mb-3">
                <FiCalendar className="mr-1" />
                {new Date(blog.publishingDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <p className="text-gray-600 mb-4 line-clamp-3">{blog.summary}</p>

              {blog.travelTags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.travelTags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center pt-4 border-t border-gray-100">
                {blog.authorImage && (
                  <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                    <Image
                      src={blog.authorImage}
                      alt={blog.authorName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {blog.authorName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(blog.createdAt || "").toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-8">
        <button
          className="px-4 py-2 mx-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <button
          className="px-4 py-2 mx-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage * postsPerPage >= (filteredBlogs?.length || 0)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BlogCardGrid;
