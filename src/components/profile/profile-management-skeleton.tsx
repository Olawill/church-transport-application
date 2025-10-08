import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ProfileManagementSkeleton = ({
  isAdminOrOwner,
}: {
  isAdminOrOwner: boolean;
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Profile Management</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList
          className={cn(
            "grid w-full grid-cols-4",
            isAdminOrOwner && "grid-cols-5"
          )}
        >
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isAdminOrOwner && (
            <TabsTrigger value="church">Church Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 rounded-md w-48" />
              <Skeleton className="h-10 rounded-md w-32" />
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="h-10 rounded-md w-40" />
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 rounded w-24" />
                  <Skeleton className="h-10 rounded-md" />
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <Skeleton className="h-10 rounded-md w-full" />
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 rounded-md w-32" />
              <Skeleton className="h-10 rounded-md w-36" />
            </div>
          </div>

          <div className="p-6 space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 rounded w-20" />
                      <Skeleton className="h-5 rounded w-16" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 rounded w-48" />
                      <Skeleton className="h-4 rounded w-56" />
                      <Skeleton className="h-4 rounded w-32" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 rounded w-24" />
                    <Skeleton className="size-9 rounded" />
                    <Skeleton className="size-9 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="w-full p-6 space-y-6">
            <Skeleton className="h-9 rounded-md w-64" />

            <div className="w-full space-y-4">
              <div className="space-y-6">
                {/* 2FA Card */}
                <div className="border rounded-lg shadow-sm">
                  <div className="p-6 border-b">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="size-5 rounded" />
                      <Skeleton className="h-6 rounded w-56" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 rounded w-20" />
                        <Skeleton className="h-4 rounded w-64" />
                      </div>
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Change Password Card */}
                <div className="border rounded-lg shadow-sm">
                  <div className="p-6 border-b">
                    <Skeleton className="h-6 rounded w-40" />
                  </div>
                  <div className="p-6 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 rounded w-32" />
                        <Skeleton className="h-10 rounded-md" />
                      </div>
                    ))}
                    <Skeleton className="h-10 rounded-md w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="border rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <Skeleton className="h-6 rounded w-52" />
            </div>
            <div className="p-6 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="size-5 rounded" />
                      <Skeleton className="h-5 rounded w-40" />
                    </div>
                    <Skeleton className="h-2 rounded w-72" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 rounded w-20" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {isAdminOrOwner && (
          <TabsContent value="church">
            <div className="border rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-5 h-5 rounded" />
                  <Skeleton className="h-6 rounded w-48" />
                  <Skeleton className="h-5 rounded w-16" />
                </div>
              </div>
              <div className="p-6 space-y-2">
                <Skeleton className="h-5 rounded w-40" />
                <Skeleton className="h-4 rounded w-64" />
              </div>
            </div>

            {/* Branch Addresses Card */}
            <div className="border rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 rounded w-56" />
                  <Skeleton className="h-10 rounded-md w-36" />
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-5 rounded w-32" />
                          <Skeleton className="h-5 rounded w-24" />
                        </div>
                        <div className="flex items-start space-x-2">
                          <Skeleton className="w-4 h-4 rounded mt-1" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 rounded w-16" />
                            <Skeleton className="h-3 rounded w-48" />
                            <Skeleton className="h-3 rounded w-56" />
                            <Skeleton className="h-3 rounded w-32" />
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Skeleton className="w-4 h-4 rounded mt-1" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 rounded w-12" />
                            <Skeleton className="h-3 rounded w-40" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-6 rounded w-48" />
                          <Skeleton className="h-6 rounded w-56" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 rounded w-32" />
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
