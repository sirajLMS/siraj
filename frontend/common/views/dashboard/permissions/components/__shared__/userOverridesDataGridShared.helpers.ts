import type { User } from "@/frontend/common/graphql/generated/gql/graphql-types";

export function getAvatarInitials(user: User): string {
  return (
    user.name
      ?.split(" ")
      .map(w => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? ""
  );
}
