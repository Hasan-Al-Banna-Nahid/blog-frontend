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

  // Mutation for creating a blog
  const createBlogMutation = useMutation({
    mutationFn: (formData: FormData) => handleCreateBlog(formData),
    onSuccess: () => {
      toast.success("Blog created successfully!");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setShowForm(false);
      resetForm();
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Author Name */}
            <div>
              <label className="block text-gray-700 mb-2">Author Name*</label>
              <Controller
                name="authorName"
                control={control}
                rules={{
                  required: "Author name is required",
                  minLength: {
                    value: 3,
                    message: "Author name must be at least 3 characters",
                  },
                }}
                render={({ field }) => (
                  <div>
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.authorName
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-blue-500"
                      }`}
                      placeholder="Enter author name"
                    />
                    {errors.authorName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.authorName.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Blog Title */}
            <div>
              <label className="block text-gray-700 mb-2">Blog Title*</label>
              <Controller
                name="title"
                control={control}
                rules={{
                  required: "Title is required",
                  minLength: {
                    value: 5,
                    message: "Title must be at least 5 characters",
                  },
                }}
                render={({ field }) => (
                  <div>
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.title
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-blue-500"
                      }`}
                      placeholder="Enter blog title"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 mb-2">Category*</label>
              <Controller
                name="category"
                control={control}
                rules={{
                  required: "Category is required",
                  minLength: {
                    value: 3,
                    message: "Please select a valid category",
                  },
                }}
                render={({ field }) => (
                  <div>
                    <select
                      {...field}
                      onChange={handleCategoryChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.category
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-blue-500"
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-gray-700 mb-2">Subcategory</label>
              <Controller
                name="subCategory"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter subcategory"
                  />
                )}
              />
            </div>

            {/* Publishing Date */}
            <div>
              <label className="block text-gray-700 mb-2">
                Publishing Date
              </label>
              <Controller
                name="publishingDate"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              />
            </div>

            {/* Travel Tags */}
            <div>
              <label className="block text-gray-700 mb-2">
                Travel Tags (comma separated)
              </label>
              <input
                type="text"
                value={travelTagsInput}
                onChange={handleTravelTagsChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter travel tags, separated by commas"
              />
            </div>

            {/* Summary */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Summary*</label>
              <Controller
                name="summary"
                control={control}
                rules={{
                  required: "Summary is required",
                  minLength: {
                    value: 10,
                    message: "Summary must be at least 10 characters",
                  },
                }}
                render={({ field }) => (
                  <div>
                    <textarea
                      {...field}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.summary
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-blue-500"
                      }`}
                      placeholder="Enter blog summary"
                    />
                    {errors.summary && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.summary.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Content */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Content*</label>
              <Controller
                name="content"
                control={control}
                rules={{
                  required: "Content is required",
                  minLength: {
                    value: 20,
                    message: "Content must be at least 20 characters",
                  },
                }}
                render={({ field }) => (
                  <div>
                    <textarea
                      {...field}
                      rows={5}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.content
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-blue-500"
                      }`}
                      placeholder="Enter main content"
                    />
                    {errors.content && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.content.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Author Image */}
            <div>
              <label className="block text-gray-700 mb-2">Author Image*</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAuthorImageChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  !authorImageFile && !control._formValues.authorImage
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                required={!control._formValues.authorImage}
              />
              {authorImageFile ? (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {authorImageFile.name}
                </p>
              ) : control._formValues.authorImage ? (
                <p className="text-sm text-gray-500 mt-1">
                  Current image will be kept
                </p>
              ) : (
                <p className="text-sm text-red-500 mt-1">
                  Author image is required
                </p>
              )}
            </div>

            {/* Media Upload */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">
                Media Files (Multiple)
              </label>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mediaFiles.length > 0 ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Selected files:</p>
                  <ul className="text-sm text-gray-500 list-disc pl-5">
                    {mediaFiles.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              ) : control._formValues.media?.length ? (
                <p className="text-sm text-gray-500 mt-1">
                  Current media files will be kept
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50"
              disabled={
                createBlogMutation.isPending ||
                updateBlogMutation.isPending ||
                Object.keys(errors).length > 0
              }
            >
              {editingBlogId ? "Update Blog" : "Create Blog"}
            </button>
          </div>
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
          {blogsData?.length > 0 ? (
            blogsData?.map((blog: Blog) => (
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
        </div>
      )}
    </div>
  );
};

export default BlogPage;
