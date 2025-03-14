import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-5xl font-bold text-center mb-8">Music Annotater</h1>
      <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl">
        The easiest way to annotate music.
      </p>
      <Link
        href="/annotate"
        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg text-lg hover:bg-blue-700 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}
