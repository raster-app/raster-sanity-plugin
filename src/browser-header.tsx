import { Fragment } from "react";
import {
  useSession,
  type AssetSearch,
  type Organization,
  type RasterNavigation,
} from "@raster/react";
import { icons } from "@sanity/icons";
import { Box, Button, Flex, Select, Text, TextInput } from "@sanity/ui";

type Crumb = { key: string; label: string; onClick?: () => void };

export type BrowserHeaderProps = {
  nav: RasterNavigation;
  organizations: Array<Organization>;
  organization: Organization | null;
  search: AssetSearch;
  /** Absent when there is no library to upload to. */
  onUpload?: () => void;
  isUploading: boolean;
  onRefresh: () => void;
};

/** The organization switcher, breadcrumb and actions, and the search box below them. */
export function BrowserHeader({
  nav,
  organizations,
  organization,
  search,
  onUpload,
  isUploading,
  onRefresh,
}: BrowserHeaderProps) {
  /** Context */
  const { userName, isSignedIn, signOut } = useSession();

  /** Render-only values */
  // With one organization there is nothing to switch to, so the trail starts with its name.
  // With several, the select names it and the trail starts at its libraries.
  const canSwitch = organizations.length > 1;

  const crumbs: Array<Crumb> = [
    {
      key: "organization",
      label: canSwitch ? "Libraries" : (organization?.name ?? "Raster"),
      onClick: nav.library === null ? undefined : () => nav.openLibrary(null),
    },
  ];
  if (nav.library !== null) {
    crumbs.push({
      key: "library",
      label: nav.library.name ?? "Library",
      onClick: nav.asset === null ? undefined : () => nav.openAsset(null),
    });
  }
  if (nav.asset !== null) {
    crumbs.push({ key: "asset", label: nav.asset.name ?? "Asset" });
  }

  const searchHint = search.active
    ? search.isSearching
      ? "Searching…"
      : `${search.found} ${search.found === 1 ? "result" : "results"}`
    : undefined;

  return (
    <>
      <Flex align="center" gap={2} wrap="wrap">
        {canSwitch && (
          <Select
            fontSize={1}
            padding={2}
            aria-label="Organization"
            value={organization?.id ?? ""}
            onChange={(event) => nav.selectOrganization(event.currentTarget.value)}
          >
            {organizations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name ?? item.id}
              </option>
            ))}
          </Select>
        )}

        <Flex as="nav" aria-label="Breadcrumb" align="center" gap={1} wrap="wrap">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <Fragment key={crumb.key}>
                {index > 0 && (
                  <Text size={1} muted aria-hidden="true">
                    /
                  </Text>
                )}
                {/* Where you already are is text, not a button that does nothing. */}
                {isLast || crumb.onClick === undefined ? (
                  <Box padding={2}>
                    <Text size={1} weight="medium" aria-current={isLast ? "page" : undefined}>
                      {crumb.label}
                    </Text>
                  </Box>
                ) : (
                  <Button
                    mode="bleed"
                    fontSize={1}
                    padding={2}
                    text={crumb.label}
                    onClick={crumb.onClick}
                  />
                )}
              </Fragment>
            );
          })}
        </Flex>

        <Box flex={1} />

        {onUpload !== undefined && (
          <Button
            mode="ghost"
            fontSize={1}
            padding={2}
            icon={icons.upload}
            text={nav.asset === null ? "Upload" : "Add a variant"}
            disabled={isUploading}
            loading={isUploading}
            onClick={onUpload}
          />
        )}
        <Button
          mode="bleed"
          fontSize={1}
          padding={2}
          icon={icons.refresh}
          title="Refresh"
          aria-label="Refresh"
          onClick={onRefresh}
        />
        <Button
          mode="bleed"
          fontSize={1}
          padding={2}
          icon={icons.leave}
          text="Sign out"
          title={
            isSignedIn
              ? `Signed in as ${userName ?? "your Raster account"}`
              : "Connected with an organization API key"
          }
          onClick={() => void signOut()}
        />
      </Flex>

      {nav.asset === null && nav.organizationId !== null && (
        <Flex direction="column" gap={2}>
          {/* No debounce here: `useAssetSearch` already debounces, and twice feels laggy. */}
          <TextInput
            type="search"
            icon={icons.search}
            fontSize={1}
            padding={2}
            value={nav.query}
            placeholder={
              nav.library === null
                ? `Search ${organization?.name ?? "this organization"}`
                : `Search ${nav.library.name ?? "this library"}`
            }
            aria-label="Search"
            onChange={(event) => nav.setQuery(event.currentTarget.value)}
          />
          {searchHint !== undefined && (
            <Text size={1} muted aria-live="polite">
              {searchHint}
            </Text>
          )}
        </Flex>
      )}
    </>
  );
}
