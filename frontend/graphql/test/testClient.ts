import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";

export const TEST_HOST = "http://localhost";
export const TEST_PORT = 3001;
export const TEST_GRAPHQL_URL = `${TEST_HOST}:${TEST_PORT}/api/graphql`;

export const testClient = new ApolloClient({
  link: new HttpLink({
    uri: TEST_GRAPHQL_URL,
    headers: {
      "apollo-require-preflight": "true",
    },
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "no-cache",
    },
  },
});
