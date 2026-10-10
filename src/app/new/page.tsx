"use client";

import axios from "axios";
import { useEffect, useState } from "react";

interface Character {
  id: number;
  name: string;
  images?: string[];
  personal?: {
    clan?: string;
    classification?: string | string[];
  };
}

interface ApiResponse {
  characters: Character[];
}

const NewPage = () => {
  const [data, setData] = useState<Character[]>([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          "https://dattebayo-api.onrender.com/characters"
        );
        setData(response.data.characters);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    getData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">
        Naruto Characters
      </h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((character) => (
          <div
            key={character.id}
            className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900"
          >
            <img
              src={character.images?.[0]}
              alt={character.name}
              className="h-64 w-full bg-gray-950 object-contain"
            />

            <div className="p-4">
              <h2 className="text-lg font-semibold">
                {character.name}
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {character.personal?.clan || "Unknown Clan"}
              </p>

              <p className="mt-2 text-sm text-gray-300">
                {Array.isArray(character.personal?.classification)
                  ? character.personal.classification.join(", ")
                  : character.personal?.classification ||
                    "Unknown Classification"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default NewPage;