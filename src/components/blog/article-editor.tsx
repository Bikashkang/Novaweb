"use client";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

type ArticleEditorProps = {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
};

export function ArticleEditor({ value, onChange, placeholder }: ArticleEditorProps) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
    "image",
  ];

  return (
    <div className="bg-white">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Write your article content here..."}
        className="bg-white text-slate-900"
        style={{ minHeight: "400px" }}
      />
      <style jsx global>{`
        .ql-container {
          font-size: 16px;
          min-height: 400px;
        }
        .ql-editor {
          min-height: 400px;
        }
        .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .ql-toolbar {
          border-top: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-bottom: none;
          background: #f8fafc;
        }
        .ql-container {
          border-bottom: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-top: none;
        }
        .ql-snow .ql-stroke {
          stroke: #475569;
        }
        .ql-snow .ql-fill {
          fill: #475569;
        }
        .ql-snow .ql-picker-label {
          color: #475569;
        }
      `}</style>
    </div>
  );
}
