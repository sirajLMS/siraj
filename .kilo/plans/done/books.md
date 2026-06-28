 Plan: Implement Real Data and Actions for Books & Bags Resource

     📌 Context

     The Books & Bags sub-route (/resources/books-and-bags) currently shows mock data and has
     non-functional actions (buttons that show toast but don't call GraphQL mutations). This update
     will:

     - Replace the static array with real data from the GraphQL API
     - Hook up the "Delete" button to a real mutation with proper notifications
     - Replace string constants for availabilityStatus with enums from the backend
     - Fix navigation to use proper Next.js <Link> and active state
     - Replace console.log/toast with useNotifications

     This aligns with the goal of making all users actions real.

     🔧 Plan

     Files to Modify

     Frontend Views

     - app/[locale]/(dashboard)/resources/books-and-bags/page.tsx (Server Component)
     - frontend/views/dashboard/resources/books-and-bags/BooksAndBagsGrid.tsx (Client Component)
     - frontend/views/dashboard/resources/books-and-bags/BookItemCard.tsx (Client Component)

     GraphQL Documents

     - frontend/graphql/sharedDocuments/resources.documents.ts (NEW)

     Backend Types (If Needed)

     - backend/types/book.types.ts (Update to expose enums)

     Enums Check

     - backend/db/schema/enums.ts (Verify availabilityStatusEnum exists)

     ---
     Step-by-Step Changes

     1. Create GraphQL Documents (resources.documents.ts)

     Add these documents:

     // Book Query
     export const booksAndBagsQueryDocument = graphql(/* GraphQL */ `
       query BooksAndBagsQuery {
         booksAndBags {
           id
           name
           availabilityStatus
         }
       }
     `) satisfies TypedDocumentNode<BooksAndBagsQuery, BooksAndBagsQueryVariables>;

     // Delete Book Mutation
     export const deleteBookMutationDocument = graphql(/* GraphQL */ `
       mutation DeleteBookMutation($id: ID!) {
         deleteBook(id: $id) {
           id
         }
       }
     `) satisfies TypedDocumentNode<DeleteBookMutation, DeleteBookMutationVariables>;

     Impact: Enables queries/mutations but does not update components yet.

     ---
     2. Update app/[locale]/(dashboard)/resources/books-and-bags/page.tsx

     Current:
     export default function BooksAndBagsPage() {
       const [items] = React.useState([
         { id: "1", name: "Math Book", availabilityStatus: "AVAILABLE" },
         { id: "2", name: "Science Book", availabilityStatus: "OUT_OF_STOCK" },
       ]);
       // No GraphQL query
     }

     Target:
     export default async function BooksAndBagsPage({
       params: { locale },
     }: {
       params: Promise<{ locale: string }>;
     }) {
       const { locale } = await params;
       const booksAndBags = await getCurrentUserService().getBooksAndBags();

       return (
         <PageContainer title={"Books & Bags"}>
           <BooksAndBagsClient books={booksAndBags} />
         </PageContainer>
       );
     }

     Helper (add to backend/services/BookService.ts):
     @React.cache // Prevents duplicate fetches in layout/page
     public async getBooksAndBags() {
       const repo = new BookRepository(this.db);
       return repo.findMany();
     }

     Why Server Component: Avoids GraphQL query round-trip; fetches directly from service.

     ---
     3. Update BooksAndBagsGrid.tsx

     Current:
     type Book = {
       id: string;
       name: string;
       availabilityStatus: string;
     };

     Target:
     import { type BookReturnType } from "@/backend/types/book.types";

     // Use enum for status
     const statusColor = {
       [BookReturnType.AvailabilityStatus.AVAILABLE]: "success",
       [BookReturnType.AvailabilityStatus.OUT_OF_STOCK]: "error",
     };

     Update Backend Types (book.types.ts):
     export type BookReturnType = {
       id: string;
       name: string;
       availabilityStatus: Database["public"]["Enums"]["availability_status"];
     };

     Impact: Type-safe status values.

     ---
     4. Update BookItemCard.tsx

     Current:
     <Button variant="outlined" onClick={() => console.log("Delete", props.book.id)}>
       Delete
     </Button>

     Target:
     "use client"

     import { useNotifications } from "@toolpad/core/useNotifications";
     import { deleteBookMutationDocument } from
     "@/frontend/graphql/sharedDocuments/resources.documents";

     const BookItemCard = ({ book }: { book: BookReturnType }) => {
       const [deleteBook] = useMutation(deleteBookMutationDocument);
       const notifications = useNotifications();

       const handleDelete = () => {
         deleteBook({ variables: { id: book.id } })
           .then(() => {
             notifications.show({
               severity: "success",
               message: "Book deleted",
               autoHideDuration: 3000,
             });
           })
           .catch(() => {
             notifications.show({
               severity: "error",
               message: "Failed to delete book",
               autoHideDuration: 5000,
             });
           });
       };

       return (
         <Button variant="outlined" onClick={handleDelete}>
           Delete
         </Button>
       );
     };

     Impact: Real mutation + useNotifications.

     ---
     5. Fix Navigation

     Current:
     <Link href="/resources">Back to Resources</Link>
     <Link href="/resources/curriculum">Curriculum</Link> // No active state

     Target:
     import { usePathname } from "next/navigation";

     const pathName = usePathname();
     const isActive = pathName.endsWith("/books-and-bags");

     <Link href="/resources/books-and-bags" aria-current={isActive ? "page" : undefined}>
       Books & Bags
     </Link>

     Impact: Active state + proper deep-link behavior.

     ---
     Testing Strategy

     1. Frontend Tests (frontend/views/dashboard/resources/books-and-bags/)
       - Mock GraphQL booksAndBagsQueryDocument in BooksAndBagsGrid.test.tsx
       - Test enum-based availabilityStatus rendering
       - Test BookItemCard delete mutation
       - Test active state in navigation
     2. Backend Tests
       - If BookService is updated: bun test:db:repo for BookRepository
       - If Pothos resolvers are missing: bun test:graphql for books/deleteBook

     ---
     Dependencies

     - GraphQL Documents: Ensure booksAndBags/deleteBook resolvers exist in Pothos
     - Backend Types: Ensure BookReturnType exposes availabilityStatus as enum
     - Notifications: Confirm @toolpad/core is installed

     ✅ Verification

     After implementation:
     1. Visit /resources/books-and-bags and verify data loads
     2. Click "Delete" and verify:
       - Notification appears
       - Book disappears from the list
     3. Refresh page to confirm persistence
     4. Check navigation active state
     5. Run bun quality-gate to ensure no lint/ts errors