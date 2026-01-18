import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ProfileManagementSkeleton = ({
  isAdminOrOwner,
}: {
  isAdminOrOwner: boolean;
}) => {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">Profile Management</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex h-auto w-full flex-nowrap items-center justify-start overflow-x-auto [&_button]:data-[state=active]:shadow-none">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isAdminOrOwner && (
            <TabsTrigger value="church">Church Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-48 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>

          {/* Card Content */}
          <div className="space-y-6 p-6">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-10 w-40 rounded-md" />
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-10 rounded-md" />
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-32 rounded-md" />
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </div>

          <div className="space-y-4 p-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-20 rounded" />
                      <Skeleton className="h-5 w-16 rounded" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48 rounded" />
                      <Skeleton className="h-4 w-56 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-24 rounded" />
                    <Skeleton className="size-9 rounded" />
                    <Skeleton className="size-9 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="w-full space-y-6 p-6">
            <Skeleton className="h-9 w-64 rounded-md" />

            <div className="w-full space-y-4">
              <div className="space-y-6">
                {/* 2FA Card */}
                <div className="rounded-lg border shadow-sm">
                  <div className="border-b p-6">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="size-5 rounded" />
                      <Skeleton className="h-6 w-56 rounded" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-20 rounded" />
                        <Skeleton className="h-4 w-64 rounded" />
                      </div>
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Change Password Card */}
                <div className="rounded-lg border shadow-sm">
                  <div className="border-b p-6">
                    <Skeleton className="h-6 w-40 rounded" />
                  </div>
                  <div className="space-y-4 p-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-10 rounded-md" />
                      </div>
                    ))}
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-lg border shadow-sm">
            <div className="border-b p-6">
              <Skeleton className="h-6 w-52 rounded" />
            </div>
            <div className="space-y-6 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="size-5 rounded" />
                      <Skeleton className="h-5 w-40 rounded" />
                    </div>
                    <Skeleton className="h-2 w-72 rounded" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {isAdminOrOwner && (
          <TabsContent value="church">
            <div className="rounded-lg border shadow-sm">
              <div className="border-b p-6">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-48 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              </div>
              <div className="space-y-2 p-6">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-4 w-64 rounded" />
              </div>
            </div>

            {/* Branch Addresses Card */}
            <div className="rounded-lg border shadow-sm">
              <div className="border-b p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-56 rounded" />
                  <Skeleton className="h-10 w-36 rounded-md" />
                </div>
              </div>
              <div className="space-y-4 p-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 w-32 rounded" />
                          <Skeleton className="h-5 w-24 rounded" />
                        </div>
                        <div className="flex items-start space-x-2">
                          <Skeleton className="mt-1 h-4 w-4 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-16 rounded" />
                            <Skeleton className="h-3 w-48 rounded" />
                            <Skeleton className="h-3 w-56 rounded" />
                            <Skeleton className="h-3 w-32 rounded" />
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Skeleton className="mt-1 h-4 w-4 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-12 rounded" />
                            <Skeleton className="h-3 w-40 rounded" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-48 rounded" />
                          <Skeleton className="h-6 w-56 rounded" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-32 rounded" />
                        <Skeleton className="size-9 rounded" />
                        <Skeleton className="size-9 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
