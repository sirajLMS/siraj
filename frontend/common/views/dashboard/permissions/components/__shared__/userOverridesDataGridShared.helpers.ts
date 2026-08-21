import type { UsersQuery_users } from "@/frontend/common/graphql/generated/gql/graphql";

export function getAvatarInitials(user: UsersQuery_users): string {
  return (
    user.name
      ?.split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? ""
  );
}
