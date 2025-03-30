import axios from "axios";

const API_URL = "http://localhost:5000/api/blogs";

export interface Blog {
  _id?: string;
  authorName: string;
  title: string; // Changed from blogTitle
  category: string;
  subCategory?: string; // Made optional to match backend
  summary: string;
  content: string; // Changed from mainContent
  travelTags: string[];
  publishingDate: string;
  authorImage: string;
  media: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Fetch all blogs
export const fetchBlogs = async (): Promise<Blog[]> => {
  try {
    const response = await axios.get(API_URL);
    return response.data.blogs;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blogs");
  }
};

// Create a new blog with file upload support
export const handleCreateBlog = async (formData: FormData): Promise<Blog> => {
  try {
    const response = await axios.post(`${API_URL}/create`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating blog:", error);
    throw new Error("Failed to create blog");
  }
};

// Update an existing blog with file upload support
export const handleUpdateBlog = async ({
  id,
  formData,
}: {
  id: string;
  formData: FormData;
}): Promise<Blog> => {
  try {
    const response = await axios.put(`${API_URL}/update/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating blog:", error);
    throw new Error("Failed to update blog");
  }
};

// Delete a blog by ID
export const handleDeleteBlog = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/delete/${id}`);
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw new Error("Failed to delete blog");
  }
};
