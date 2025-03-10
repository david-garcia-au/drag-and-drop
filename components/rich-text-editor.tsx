"use client";

import { forwardRef, useRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const QuillNoSSR = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

interface RichTextEditProps {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextEdit = forwardRef<any, RichTextEditProps>(
  ({ value, onChange }, ref) => {
    const quillRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focus: () => quillRef.current?.focus(),
    }));

    const modules = {
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
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
      "strike",
      "blockquote",
      "list",
      "bullet",
      "link",
      "image",
    ];

    return (
      <QuillNoSSR
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="h-64"
      />
    );
  }
);

RichTextEdit.displayName = "RichTextEdit";
