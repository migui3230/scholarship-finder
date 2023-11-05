"use client";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import React, { useState } from "react";

// * for server component only
// export default async function Index() {

interface ScholarshipDocument {
  id: number;
  name: string;
  years: string;
  link: string;
  amount: number;
  description: string;
  similarity: number;
}

export default function Index() {
  const [textAreaContent, setTextAreaContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [matchingDcouments, setMatchingDocuments] =
    useState<ScholarshipDocument[]>();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const sanitizeText = (input: string): string => {
    const map: { [key: string]: string } = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&#039;": "'", // Included the additional apostrophe encoding
      "&#x2F;": "/",
      "&#x5C;": "\\",
      "&#x60;": "`",
    };

    return input.replace(
      /&amp;|&lt;|&gt;|&quot;|&#39;|&#039;|&#x2F;|&#x5C;|&#x60;/g,
      (match) => map[match]
    );
  };

  const getMatchingDocuments = async () => {
    // take the text area to the content
    const modelId = "text-embedding-ada-002";
    const openaiUrl = "https://api.openai.com/v1/embeddings";
    const payload = {
      input: textAreaContent,
      model: modelId,
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
    };

    // generate embeddings  from it
    try {
      setIsLoading(true);
      const response = await axios.post(openaiUrl, payload, { headers });
      if (response.status === 200) {
        const embedding = response.data.data[0].embedding;
        // rpc call to get the matching documents
        const { data, error } = await supabase.rpc("match_documents", {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 3,
        });
        setIsLoading(false);
        setMatchingDocuments(data);

        return data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="flex flex-col justify-center h-2/3 pt-56">
        <div className="top-0 m-4 py-4">
          <h1 className="text-4xl text-center">
            What scholarship are you looking for?
          </h1>
        </div>
      </div>

      <link
        rel="stylesheet"
        href="https://unpkg.com/flowbite@1.4.4/dist/flowbite.min.css"
      />

      <div className="w-3/5 mx-auto">
        <textarea
          id="message"
          rows={4}
          className="block h-36 p-2.5 w-full text-lg text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Scholarship for juniors majoring in computer science"
          value={textAreaContent}
          onChange={(e) => setTextAreaContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && textAreaContent.trim()) {
              e.preventDefault();
              getMatchingDocuments();
            }
          }}
        ></textarea>
        <div className="flex justify-center mt-4 pt-4">
          <button
            type="button"
            disabled={isLoading || !textAreaContent.trim()}
            onClick={getMatchingDocuments}
            className={`text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-md px-6 py-3 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 ${
              isLoading || !textAreaContent.trim()
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Search
          </button>
        </div>
      </div>

      <div>
        {matchingDcouments && (
          <div className="flex flex-col justify-center h-2/3 pt-28">
            <div className="top-0 m-4">
              <h1 className="text-3xl text-center pb-10 font-bold">Results</h1>
              {matchingDcouments.map((document, index) => (
                // formatting needed here and embed link in name make it look like a link and give spacing between different results
                <div key={index} className="mb-6">
                  <h2>
                    <a
                      href={document.link}
                      className="text-blue-500 underline font-semibold text-xl"
                    >
                      {document.name}
                    </a>
                  </h2>
                  <p className="font-semibold text-lg">${document.amount}</p>
                  <p className="font-medium text-md mt-2">
                    {sanitizeText(document.years)}
                  </p>
                  <p className="font-light text-sm mt-2">
                    {sanitizeText(document.description)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <script src="https://unpkg.com/flowbite@1.4.0/dist/flowbite.js"></script>
    </>
  );
}
