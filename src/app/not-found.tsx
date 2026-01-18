import { HomeIcon, RabbitIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Page not Found",
  description: "The page you are looking for does not exist",
  openGraph: {
    title: "Page not Found | ActsOnWheels",
    description: "Manage your church transportation needs",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const notFoundContents = [
  {
    title: "Looks Like You Missed the Bus",
    description:
      "This page took a different route and didn't arrive at its destination.",
    content:
      "Double-check the address or head back to the dashboard and catch the next ride.",
  },
  {
    title: "We Took a Wrong Turn",
    description: "The page you're looking for isn't on this route.",
    content:
      "Let's get you back on track—head to the dashboard to continue your journey.",
  },
  {
    title: "Oops! Detour Ahead",
    description: "Even the best routes sometimes need a reroute.",
    content:
      "Try heading back to the dashboard and we'll guide you from there.",
  },
];

const NotFound = () => {
  const pageNotFound =
    notFoundContents[Math.floor(Math.random() * notFoundContents.length)];

  return (
    <div className="my-auto flex min-h-screen w-full items-center px-4 sm:px-6 lg:px-8">
      <Empty className="bg-sidebar w-full border border-dashed shadow-lg backdrop-blur">
        <EmptyHeader className="mx-auto w-full max-w-md xl:max-w-lg">
          <EmptyMedia variant="icon">
            <RabbitIcon className="size-8" />
          </EmptyMedia>
          <EmptyTitle className="text-2xl">{pageNotFound.title}</EmptyTitle>
          <EmptyDescription className="w-full text-lg">
            {pageNotFound.description}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mx-auto w-full max-w-md text-xl xl:max-w-lg">
          <p>{pageNotFound.content}</p>

          <Button asChild className="cursor-pointer">
            <Link href="/">
              <HomeIcon />
              Return to Homepage
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
};

export default NotFound;
