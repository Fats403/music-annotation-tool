import { TaxonomyProvider } from "@/contexts/TaxonomyContext";
import { SignInButton } from "@clerk/nextjs";
import { SignUpButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { SignedIn } from "@clerk/nextjs";
import { SignedOut } from "@clerk/nextjs";

export default function AnnotateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TaxonomyProvider>
      <header className="flex justify-end items-center p-4 gap-4 h-16">
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      {children}
    </TaxonomyProvider>
  );
}
