"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  fetchBlogs,
  handleCreateBlog,
  handleUpdateBlog,
  handleDeleteBlog,
  Blog,
} from "@/app/services/blogService";
import Link from "next/link";

const BlogPage: React.FC = () => {
  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Blog>({
    defaultValues: {
      authorName: "",
      title: "",
      category: "",
      subCategory: "",
      summary: "",
      content: "",
      travelTags: [],
      publishingDate: new Date().toISOString().split("T")[0],
      authorImage: "",
      media: [],
    },
  });

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [travelTagsInput, setTravelTagsInput] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const blogsPerPage = 3;

  const [categoryOptions] = useState<string[]>([
    "Technology",
    "Health",
    "Business",
    "Lifestyle",
    "Education",
    "Travel",
    "Sports",
    "Entertainment",
    "Food",
    "Finance",
  ]);

  const queryClient = useQueryClient();

  const {
    isLoading,
    isError,
    data: blogsData = [],
    error: queryError,
  } = useQuery<Blog[], Error>({
    queryKey: ["blogs"],
    queryFn: fetchBlogs,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Pagination logic
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = blogsData.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(blogsData.length / blogsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Mutation for creating a blog
  const createBlogMutation = useMutation({
    mutationFn: (formData: FormData) => handleCreateBlog(formData),
    onSuccess: () => {
      toast.success("Blog created successfully!");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setShowForm(false);
      resetForm();
      setCurrentPage(1); // Reset to first page after creating a new blog
    },
    onError: (error: Error) => {
      console.error("Create blog error:", error);
      const errorMessage = error.message || "Failed to create blog";
      toast.error(errorMessage);
    },
  });

  // Mutation for updating a blog
  const updateBlogMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      handleUpdateBlog({ id, formData }),
    onSuccess: () => {
      toast.success("Blog updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setShowForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      console.error("Update blog error:", error);
      const errorMessage = error.message || "Failed to update blog";
      toast.error(errorMessage);
    },
  });

  // Mutation for deleting a blog
  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) => handleDeleteBlog(id),
    onSuccess: () => {
      toast.success("Blog deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      // If deleting the last item on the current page, go back a page
      if (currentBlogs.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
    onError: (error: Error) => {
      console.error("Delete blog error:", error);
      const errorMessage = error.message || "Failed to delete blog";
      toast.error(errorMessage);
    },
  });

  const resetForm = () => {
    reset({
      authorName: "",
      title: "",
      category: "",
      subCategory: "",
      summary: "",
      content: "",
      travelTags: [],
      publishingDate: new Date().toISOString().split("T")[0],
      authorImage: "",
      media: [],
    });
    setEditingBlogId(null);
    setAuthorImageFile(null);
    setMediaFiles([]);
    setTravelTagsInput("");
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setValue("category", value, { shouldValidate: true });
  };

  const handleAuthorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAuthorImageFile(e.target.files[0]);
    } else {
      setAuthorImageFile(null);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    } else {
      setMediaFiles([]);
    }
  };

  const handleTravelTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTravelTagsInput(value);
    const tagsArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setValue("travelTags", tagsArray, { shouldValidate: true });
  };

  const handleUpdate = (blog: Blog) => {
    setEditingBlogId(blog._id || null);
    setShowForm(true);

    reset({
      authorName: blog.authorName || "",
      title: blog.title || "",
      category: blog.category || "",
      subCategory: blog.subCategory || "",
      summary: blog.summary || "",
      content: blog.content || "",
      travelTags: blog.travelTags || [],
      publishingDate:
        blog.publishingDate?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      authorImage: blog.authorImage || "",
      media: blog.media || [],
    });
    setTravelTagsInput(blog.travelTags?.join(", ") || "");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      toast
        .promise(deleteBlogMutation.mutateAsync(id), {
          loading: "Deleting blog...",
          success: "Blog deleted successfully!",
          error: (error) => {
            console.error("Delete error:", error);
            return error.message || "Failed to delete blog";
          },
        })
        .catch((error) => {
          console.error("Delete error:", error);
        });
    }
  };

  const onSubmit = async (data: Blog) => {
    const formData = new FormData();

    // Append all required fields
    formData.append("authorName", data.authorName);
    formData.append("title", data.title);
    formData.append("category", data.category);
    formData.append("subCategory", data.subCategory || "");
    formData.append("summary", data.summary);
    formData.append("content", data.content);
    formData.append("travelTags", JSON.stringify(data.travelTags || []));
    formData.append("publishingDate", data.publishingDate);

    // Handle file uploads
    if (authorImageFile) {
      formData.append("authorImage", authorImageFile);
    } else if (data.authorImage) {
      formData.append("existingAuthorImage", data.authorImage);
    }

    mediaFiles.forEach((file) => {
      formData.append("media", file);
    });

    if (mediaFiles.length === 0 && data.media?.length) {
      formData.append("existingMedia", JSON.stringify(data.media));
    }

    try {
      if (editingBlogId) {
        await toast.promise(
          updateBlogMutation.mutateAsync({
            id: editingBlogId,
            formData,
          }),
          {
            loading: "Updating blog...",
            success: "Blog updated successfully!",
            error: (error) => error.message || "Failed to update blog",
          }
        );
      } else {
        await toast.promise(createBlogMutation.mutateAsync(formData), {
          loading: "Creating blog...",
          success: "Blog created successfully!",
          error: (error) => error.message || "Failed to create blog",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      // Error toast is already handled by toast.promise
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100">
      <h1 className="text-4xl font-semibold text-center mb-8 text-blue-700">
        Blog Management
      </h1>
      <div>
        <Link href={"/"}>
          <button className="bg-red-600 text-white p-4 w-[250px] my-6 rounded-full">
            Home
          </button>
        </Link>
      </div>
      <button
        onClick={() => {
          setShowForm(!showForm);
          if (!showForm) {
            resetForm();
          }
        }}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
      >
        {showForm ? "Cancel" : "New Blog"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-6 bg-white p-8 rounded-lg shadow-lg"
          encType="multipart/form-data"
        >
          {/* Form fields remain the same as before */}
          {/* ... */}
        </form>
      )}

      {/* Existing Blogs */}
      <h2 className="text-3xl font-medium text-blue-600 mt-12 mb-6">
        Existing Blogs
      </h2>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading blogs...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong>Error loading blogs!</strong>
          <p>{queryError?.message || "Unknown error occurred"}</p>
          <p>Check console for details.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentBlogs?.length > 0 ? (
            currentBlogs?.map((blog: Blog) => (
              <div
                key={blog._id || Math.random().toString(36).substring(2, 9)}
                className="p-6 bg-white shadow-lg rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="text-xl font-semibold text-blue-700">
                    {blog.title || "Untitled Blog"}
                  </h3>
                  <p className="text-gray-500">
                    {blog.summary || "No summary available"}
                  </p>
                  <div className="text-sm text-gray-400">
                    <p>By: {blog.authorName || "Unknown author"}</p>
                    <p>Category: {blog.category || "Uncategorized"}</p>
                    <p>Subcategory: {blog.subCategory || "None"}</p>
                    {blog.publishingDate && (
                      <p>
                        {new Date(blog.publishingDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => handleUpdate(blog)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300"
                    disabled={deleteBlogMutation.isPending}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => blog._id && handleDelete(blog._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
                    disabled={deleteBlogMutation.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-lg text-gray-500 py-8">
              No blogs available. {!isLoading && "Try creating one!"}
            </p>
          )}

          {/* Pagination Controls */}
          {blogsData.length > blogsPerPage && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-l-md border ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-4 py-2 border-t border-b ${
                        currentPage === number
                          ? "bg-blue-500 text-white"
                          : "bg-white text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {number}
                    </button>
                  )
                )}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-r-md border ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogPage;
