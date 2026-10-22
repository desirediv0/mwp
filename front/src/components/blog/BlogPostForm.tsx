import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Editor } from "@/components/editor";
import { Loader2, X, Image as ImageIcon } from "lucide-react";
import { API_URL } from "@/config/api";
import { getImageUrl } from "@/utils/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { BlogPostPreview } from "./BlogPostPreview";

interface BlogPostFormProps {
  postId?: string;
  isEditing?: boolean;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const blogPostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  summary: z
    .string()
    .max(200, "Summary cannot exceed 200 characters")
    .optional()
    .nullable(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  isPublished: z.boolean(),
  categories: z.array(z.string()).optional(),
  coverImage: z
    .any()
    .optional()
    .nullable()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      "File size should be less than 5MB"
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, and .webp files are accepted"
    ),
  removeCoverImage: z.boolean(),
  metaTitle: z
    .string()
    .max(60, "SEO title should be under 60 characters")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "SEO description should be under 160 characters")
    .optional(),
  keywords: z
    .string()
    .max(200, "Keywords should be under 200 characters")
    .optional(),
  slug: z.string().max(120).optional(),
  writtenBy: z.string().max(120).optional(),
  reviewedBy: z.string().max(160).optional(),
  lastUpdatedLabel: z.string().max(60).optional(),
  readingMinutes: z.string().max(3).optional(),
  mainQuestion: z.string().max(300).optional(),
  disclaimer: z.string().max(4000).optional(),
  ctaText: z.string().max(80).optional(),
  ctaNote: z.string().max(400).optional(),
  ctaUrl: z.string().max(400).optional(),
  referencesText: z.string().max(40000).optional(),
});

type BlogPostFormValues = {
  title: string;
  content: string;
  summary?: string | null;
  categories?: string[];
  isPublished: boolean;
  coverImage?: any;
  removeCoverImage: boolean;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  slug?: string;
  writtenBy?: string;
  reviewedBy?: string;
  lastUpdatedLabel?: string;
  readingMinutes?: string;
  mainQuestion?: string;
  disclaimer?: string;
  ctaText?: string;
  ctaNote?: string;
  ctaUrl?: string;
  referencesText?: string;
};

const BlogPostForm = ({ postId, isEditing = false }: BlogPostFormProps) => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      isPublished: false,
      categories: [],
      coverImage: null,
      removeCoverImage: false,
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      slug: "",
      writtenBy: "",
      reviewedBy: "",
      lastUpdatedLabel: "",
      readingMinutes: "",
      mainQuestion: "",
      disclaimer: "",
      ctaText: "",
      ctaNote: "",
      ctaUrl: "",
      referencesText: "",
    },
  });

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/blog-categories`);
        setCategories(response.data.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to fetch blog categories",
          variant: "destructive",
        });
      }
    };

    fetchCategories();
  }, []);

  // Fetch blog post for editing
  useEffect(() => {
    if (isEditing && postId) {
      const fetchPost = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`${API_URL}/admin/blog/${postId}`);
          const post = response.data.data;

          // Set form values
          form.setValue("title", post.title);
          form.setValue("summary", post.summary || "");
          form.setValue("content", post.content);
          form.setValue("isPublished", post.isPublished);
          form.setValue(
            "categories",
            post.categories.map((cat: { id: string }) => cat.id)
          );
          form.setValue("metaTitle", post.metaTitle || "");
          form.setValue("metaDescription", post.metaDescription || "");
          form.setValue("keywords", post.keywords || "");
          form.setValue("slug", post.slug || "");
          form.setValue("writtenBy", post.writtenBy || "");
          form.setValue("reviewedBy", post.reviewedBy || "");
          form.setValue("lastUpdatedLabel", post.lastUpdatedLabel || "");
          form.setValue("readingMinutes", post.readingMinutes ? String(post.readingMinutes) : "");
          form.setValue("mainQuestion", post.mainQuestion || "");
          form.setValue("disclaimer", post.disclaimer || "");
          form.setValue("ctaText", post.ctaText || "");
          form.setValue("ctaNote", post.ctaNote || "");
          form.setValue("ctaUrl", post.ctaUrl || "");
          form.setValue(
            "referencesText",
            Array.isArray(post.references) ? post.references.join("\n") : ""
          );
          setFaq(Array.isArray(post.faq) ? post.faq : []);

          // Set image preview if exists
          if (post.coverImageUrl) {
            setImagePreview(post.coverImageUrl);
          } else if (post.coverImage) {
            setImagePreview(getImageUrl(post.coverImage));
          }
        } catch (error) {
          console.error("Error fetching blog post:", error);
          toast({
            title: "Error",
            description: "Failed to fetch blog post",
            variant: "destructive",
          });
          navigate("/blog-management");
        } finally {
          setIsLoading(false);
        }
      };

      fetchPost();
    }
  }, [isEditing, postId]);

  // Handle file change for cover image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "File size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only .jpg, .jpeg, .png, and .webp files are accepted",
        variant: "destructive",
      });
      return;
    }

    // Update form
    form.setValue("coverImage", file);
    form.setValue("removeCoverImage", false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Clear image preview and file input
  const clearImage = () => {
    form.setValue("coverImage", null);
    setImagePreview(null);

    // If in edit mode and there was an existing image, mark for removal
    if (isEditing) {
      form.setValue("removeCoverImage", true);
    }
  };

  // Handle form submission
  const onSubmit = async (values: BlogPostFormValues) => {
    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data (for image upload)
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("isPublished", String(values.isPublished));

      // Optional fields
      if (values.summary) {
        formData.append("summary", values.summary);
      }

      if (values.categories && values.categories.length > 0) {
        formData.append("categories", JSON.stringify(values.categories));
      }

      // SEO fields
      if (values.metaTitle) {
        formData.append("metaTitle", values.metaTitle);
      }

      if (values.metaDescription) {
        formData.append("metaDescription", values.metaDescription);
      }

      if (values.keywords) {
        formData.append("keywords", values.keywords);
      }

      // Article details (always sent, so clearing a field removes it)
      if (values.slug?.trim()) formData.append("slug", values.slug.trim());
      formData.append("writtenBy", values.writtenBy || "");
      formData.append("reviewedBy", values.reviewedBy || "");
      formData.append("lastUpdatedLabel", values.lastUpdatedLabel || "");
      formData.append("readingMinutes", values.readingMinutes || "");
      formData.append("mainQuestion", values.mainQuestion || "");
      formData.append("disclaimer", values.disclaimer || "");
      formData.append("ctaText", values.ctaText || "");
      formData.append("ctaNote", values.ctaNote || "");
      formData.append("ctaUrl", values.ctaUrl || "");
      formData.append(
        "references",
        JSON.stringify(
          (values.referencesText || "")
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean)
        )
      );
      formData.append(
        "faq",
        JSON.stringify(faq.filter((f) => f.question.trim() || f.answer.trim()))
      );

      // Handle cover image
      if (values.coverImage instanceof File) {
        formData.append("coverImage", values.coverImage);
      }

      if (values.removeCoverImage) {
        formData.append("removeCoverImage", "true");
      }

      if (isEditing && postId) {
        await axios.put(`${API_URL}/admin/blog/${postId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        toast({
          title: "Success",
          description: "Blog post updated successfully",
        });
      } else {
        await axios.post(`${API_URL}/admin/blog`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        toast({
          title: "Success",
          description: "Blog post created successfully",
        });
      }

      // Navigate back to blog management page
      navigate("/blog-management");
    } catch (error) {
      console.error("Error saving blog post:", error);
      toast({
        title: "Error",
        description: "Failed to save blog post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter post title"
                      {...field}
                      className="text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the post (optional)"
                      {...field}
                      value={field.value || ""}
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    A short summary displayed in blog listings (max 200
                    characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Editor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Write your blog post content here..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border p-4 rounded-lg space-y-4 mt-6">
              <h3 className="font-medium text-lg">SEO Settings</h3>

              <FormField
                control={form.control as any}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SEO title (recommended 50-60 chars)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      If left empty, the post title will be used
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Meta description (recommended under 160 chars)"
                        {...field}
                        className="resize-none"
                        rows={2}
                      />
                    </FormControl>
                    <FormDescription>
                      If left empty, the post summary will be used
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Comma-separated keywords"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Keywords for search engines (comma-separated)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6 space-y-4">
                <h3 className="text-base font-semibold">Article details</h3>
                <p className="text-sm text-muted-foreground">
                  Shown on the article page: the author line, review status, FAQ, references and the button at the end.
                </p>

              <FormField
                control={form.control as any}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page address (URL slug)</FormLabel>
                    <FormControl>
                      <Input placeholder="saffron-mood-emotional-wellness-research" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="writtenBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Written by</FormLabel>
                    <FormControl>
                      <Input placeholder="MWP University Editorial Team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="reviewedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reviewed by</FormLabel>
                    <FormControl>
                      <Input placeholder="Pending Professional Review" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="lastUpdatedLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last updated</FormLabel>
                    <FormControl>
                      <Input placeholder="October 2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="readingMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reading time (minutes)</FormLabel>
                    <FormControl>
                      <Input placeholder="5" {...field} inputMode="numeric" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="mainQuestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main customer question</FormLabel>
                    <FormControl>
                      <Input placeholder="Can saffron help support mood and emotional wellness?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="referencesText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>References (one per line)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Author, A. (2020). Title. Journal." rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Frequently asked questions</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFaq((l) => [...l, { question: "", answer: "" }])}
                    >
                      Add question
                    </Button>
                  </div>
                  {faq.length === 0 && (
                    <p className="text-sm text-muted-foreground">No questions yet.</p>
                  )}
                  {faq.map((item, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2">
                      <Input
                        placeholder="Question"
                        value={item.question}
                        onChange={(e) =>
                          setFaq((l) => l.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))
                        }
                      />
                      <Textarea
                        placeholder="Answer"
                        rows={3}
                        value={item.answer}
                        onChange={(e) =>
                          setFaq((l) => l.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setFaq((l) => l.filter((_, j) => j !== i))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

              <FormField
                control={form.control as any}
                name="disclaimer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disclaimer</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Shown in a note box under the article" rows={4} {...field} />
                    </FormControl>
                    <FormDescription>If left empty, a standard FDA disclaimer is shown.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="ctaNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sentence above the button</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explore the MWP Ingredient Library to learn more." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="ctaText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Button text</FormLabel>
                    <FormControl>
                      <Input placeholder="Learn More About Saffron" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="ctaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Button link</FormLabel>
                    <FormControl>
                      <Input placeholder="/ingredients" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control as any}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Publish</FormLabel>
                        <FormDescription>
                          Make this post visible to visitors
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="mb-2 inline-block">
                    Categories
                  </FormLabel>
                  <div className="mt-2 space-y-2 border rounded-lg p-3">
                    {categories.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          No categories available
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            window.open(
                              "/blog-management?tab=categories",
                              "_blank"
                            )
                          }
                        >
                          Create Categories
                        </Button>
                      </div>
                    ) : (
                      <FormField
                        control={form.control as any}
                        name="categories"
                        render={() => (
                          <FormItem>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                              {categories.map((category) => (
                                <FormField
                                  key={category.id}
                                  control={form.control as any}
                                  name="categories"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={category.id}
                                        className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(
                                              category.id
                                            )}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                field.onChange([
                                                  ...(field.value || []),
                                                  category.id,
                                                ]);
                                              } else {
                                                field.onChange(
                                                  field.value?.filter(
                                                    (value: string) =>
                                                      value !== category.id
                                                  )
                                                );
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                          {category.name}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <FormLabel>Cover Image</FormLabel>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative aspect-video mb-4">
                        <img
                          src={imagePreview}
                          alt="Cover preview"
                          className="rounded-md w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={clearImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          document.getElementById("cover-image")?.click()
                        }
                      >
                        <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Click to upload a cover image
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          JPG, PNG or WebP, max 5MB
                        </p>
                      </div>
                    )}

                    <input
                      id="cover-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/blog-management")}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update" : "Create"} Post
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview section */}
        {showPreview && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            <BlogPostPreview
              title={form.getValues("title")}
              content={form.getValues("content")}
              coverImage={imagePreview || null}
            />
          </div>
        )}
      </form>
    </Form>
  );
};

export default BlogPostForm;
