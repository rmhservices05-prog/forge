import { useContext } from "react";
import { NewsContext } from "../context/newsContextValue";

export function useNews() {
  const context = useContext(NewsContext);

  if (!context) {
    throw new Error("useNews must be used inside NewsProvider");
  }

  return context;
}
