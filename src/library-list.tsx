import { type Library } from "@raster/sdk";
import { Box, Card, Flex, Grid, Text } from "@sanity/ui";
import { LoadingState } from "./loading-state";

export type LibraryListProps = {
  /** Null means "not loaded yet", which is not the same as an organization with none. */
  libraries: Array<Library> | null;
  onOpen: (library: Library) => void;
  error?: string | null;
  emptyMessage: string;
};

/** The libraries in an organization. */
export function LibraryList({ libraries, onOpen, error = null, emptyMessage }: LibraryListProps) {
  /** Early returns */
  if (error !== null) {
    return (
      <Card tone="critical" padding={3} radius={2} border>
        <Text size={1}>{error}</Text>
      </Card>
    );
  }

  if (libraries === null) return <LoadingState label="Loading libraries…" />;

  if (libraries.length === 0) {
    return (
      <Box padding={4}>
        <Text size={1} muted>
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  return (
    <Grid gap={3} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
      {libraries.map((library) => (
        <Card
          key={library.id}
          as="button"
          type="button"
          padding={3}
          radius={2}
          border
          onClick={() => onOpen(library)}
          style={{ textAlign: "left" }}
        >
          <Flex direction="column" gap={2}>
            <Text size={1} weight="medium" textOverflow="ellipsis">
              {library.name ?? library.id}
            </Text>
            <Text size={1} muted>
              {library.assetsCount ?? 0} {library.assetsCount === 1 ? "asset" : "assets"}
            </Text>
          </Flex>
        </Card>
      ))}
    </Grid>
  );
}
