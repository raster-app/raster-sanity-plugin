import {
  useSession,
  type AssetSearch,
  type Organization,
  type RasterNavigation,
} from "@raster/react";
import { Breadcrumb, OrganizationMenu, SearchBar, type Crumb } from "@raster/ui";
import { Button } from "@sanity/ui";
import { LeaveIcon, RefreshIcon, UploadIcon } from "./icons";

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
  const crumbs: Array<Crumb> = [
    {
      key: "organization",
      label: organization?.name ?? "Raster",
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
      <div className="rstr-sanity-header">
        <OrganizationMenu
          organizations={organizations}
          current={organization}
          onSelect={(next) => nav.selectOrganization(next.id)}
        />
        <Breadcrumb crumbs={crumbs} />
        <span className="rstr-sanity-header__spacer" />

        {onUpload !== undefined && (
          <Button
            mode="ghost"
            fontSize={1}
            padding={2}
            icon={UploadIcon}
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
          icon={RefreshIcon}
          title="Refresh"
          aria-label="Refresh"
          onClick={onRefresh}
        />
        <Button
          mode="bleed"
          fontSize={1}
          padding={2}
          icon={LeaveIcon}
          text="Sign out"
          title={
            isSignedIn
              ? `Signed in as ${userName ?? "your Raster account"}`
              : "Connected with an organization API key"
          }
          onClick={() => void signOut()}
        />
      </div>

      {nav.asset === null && nav.organizationId !== null && (
        <SearchBar
          value={nav.query}
          onChange={nav.setQuery}
          placeholder={
            nav.library === null
              ? `Search ${organization?.name ?? "this organization"}`
              : `Search ${nav.library.name ?? "this library"}`
          }
          hint={searchHint}
        />
      )}
    </>
  );
}
