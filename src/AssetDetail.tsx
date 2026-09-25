import { Fragment, useState } from "react";
import { formatDate, formatFileSize, getFullSizeUrl, getThumbUrl, isReady } from "@raster/sdk";
import { icons } from "@sanity/icons";
import { Box, Button, Card, Flex, Grid, Text } from "@sanity/ui";
import { type RasterItem } from "./types";

export type AssetDetailProps = {
  /** The asset or variant currently selected in the grid. */
  item: RasterItem;
  /** True when `item` is a variant, so it can be made the asset's default. */
  canPromote: boolean;
  onPromote: () => void;
  /** Present in the asset-source dialog; absent in the tool, which selects nothing. */
  onPick?: (item: RasterItem) => void;
  pickLabel: string;
  /** False for a video or PDF, which an image field cannot take. */
  canPick: boolean;
  /** Offer an upload attached to this asset as a new variant. */
  onUploadVariant?: () => void;
  busy: string | null;
};

/**
 * What is known about the selected asset, and what can be done with it.
 *
 * The facts are worth the space: an editor choosing between an original and three crops is
 * choosing on dimensions and file size, and a grid of thumbnails cannot show either.
 */
export function AssetDetail({
  item,
  canPromote,
  onPromote,
  onPick,
  pickLabel,
  canPick,
  onUploadVariant,
  busy,
}: AssetDetailProps) {
  const [copied, setCopied] = useState(false);

  const thumb = getThumbUrl(item);
  const fullSize = getFullSizeUrl(item);
  // Processing assets have no usable image yet — the frame is there, the pixels are not.
  const ready = isReady(item);

  // Only a full `Asset` carries these; a variant is an image and a name.
  const contentType = "contentType" in item ? item.contentType : null;
  const size = "size" in item ? item.size : null;
  const created = "created" in item ? item.created : null;
  const uploadedBy = "uploadedBy" in item ? (item.uploadedBy?.name ?? null) : null;
  const description = "description" in item ? item.description : null;

  const facts: Array<[string, string]> = [];
  if (item.width !== null && item.height !== null) {
    facts.push(["Size", `${item.width} × ${item.height}`]);
  }
  const bytes = formatFileSize(size);
  if (bytes !== "") facts.push(["File", bytes]);
  if (contentType != null && contentType !== "") facts.push(["Type", contentType]);
  const date = formatDate(created ?? null);
  if (date !== "") facts.push(["Added", date]);
  if (uploadedBy != null && uploadedBy !== "") facts.push(["By", uploadedBy]);

  const copy = () => {
    if (fullSize === null) return;
    void navigator.clipboard?.writeText(fullSize).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => setCopied(false)
    );
  };

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Flex direction="column" gap={3}>
        {thumb !== undefined && (
          <Card radius={2} border overflow="hidden">
            <img
              src={thumb}
              alt=""
              style={{ display: "block", width: "100%", maxHeight: 220, objectFit: "contain" }}
            />
          </Card>
        )}

        <Flex direction="column" gap={2}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            {item.name ?? item.id}
          </Text>
          {description != null && description !== "" && (
            <Text size={1} muted>
              {description}
            </Text>
          )}
        </Flex>

        {facts.length > 0 && (
          // Two columns so the values line up, and a long value wraps rather than widening.
          <Grid
            as="dl"
            gapX={2}
            gapY={2}
            style={{ gridTemplateColumns: "auto minmax(0, 1fr)", margin: 0 }}
          >
            {facts.map(([label, value]) => (
              <Fragment key={label}>
                <Box as="dt">
                  <Text size={1} muted>
                    {label}
                  </Text>
                </Box>
                <Box as="dd" style={{ margin: 0, overflowWrap: "anywhere" }}>
                  <Text size={1}>{value}</Text>
                </Box>
              </Fragment>
            ))}
          </Grid>
        )}

        {!ready && (
          <Text size={1} muted>
            Raster is still processing this image.
          </Text>
        )}

        {onPick !== undefined && !canPick && (
          <Text size={1} muted>
            Only images can be used in this field.
          </Text>
        )}

        <Flex direction="column" gap={2}>
          {onPick !== undefined && (
            <Button
              mode="default"
              tone="primary"
              fontSize={1}
              padding={3}
              // Until a promote finishes, the asset's URL may still serve the previous default,
              // and that is what Sanity would fetch and store.
              disabled={!ready || !canPick || busy === "promote"}
              onClick={() => onPick(item)}
              text={pickLabel}
            />
          )}

          {canPromote && (
            <Button
              mode="ghost"
              fontSize={1}
              padding={3}
              icon={icons.publish}
              disabled={!ready || busy !== null}
              loading={busy === "promote"}
              onClick={onPromote}
              // Not "promote": the point is that everything already pointing at this asset's
              // URL starts showing this image, which is what makes it worth a confirmation
              // in the toast rather than a silent success.
              text="Make this the default"
            />
          )}

          {onUploadVariant !== undefined && (
            <Button
              mode="ghost"
              fontSize={1}
              padding={3}
              icon={icons.upload}
              disabled={busy !== null}
              onClick={onUploadVariant}
              text="Add a variant"
            />
          )}

          <Flex gap={2} wrap="wrap">
            {fullSize !== null && (
              <Button
                mode="bleed"
                fontSize={1}
                padding={2}
                icon={icons.clipboard}
                onClick={copy}
                text={copied ? "Copied" : "Copy URL"}
              />
            )}
            {item.appUrl != null && item.appUrl !== "" && (
              <Button
                as="a"
                href={item.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                mode="bleed"
                fontSize={1}
                padding={2}
                icon={icons.launch}
                text="Open in Raster"
              />
            )}
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
