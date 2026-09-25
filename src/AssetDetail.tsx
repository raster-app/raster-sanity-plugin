import { useState } from "react";
import { getFullSizeUrl, getThumbUrl, isReady } from "@raster/sdk";
import { ClipboardIcon, LaunchIcon, PublishIcon, UploadIcon } from "./icons";
import { Button, Card, Text } from "@sanity/ui";
import { formatBytes, formatDate } from "./format";
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
  const bytes = formatBytes(size);
  if (bytes !== null) facts.push(["File", bytes]);
  if (contentType != null && contentType !== "") facts.push(["Type", contentType]);
  const date = formatDate(created);
  if (date !== null) facts.push(["Added", date]);
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
      <div className="rstr-sanity-stack rstr-sanity-gap-3">
        {thumb !== undefined && (
          <img className="rstr-sanity-detail__preview" src={thumb} alt="" />
        )}

        <div className="rstr-sanity-stack rstr-sanity-gap-2">
          <Text size={1} weight="medium" textOverflow="ellipsis">
            {item.name ?? item.id}
          </Text>
          {description != null && description !== "" && (
            <Text size={1} muted>
              {description}
            </Text>
          )}
        </div>

        {facts.length > 0 && (
          <dl className="rstr-sanity-facts">
            {facts.map(([label, value]) => (
              <div key={label} style={{ display: "contents" }}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {!ready && (
          <Text size={1} muted>
            Raster is still processing this image.
          </Text>
        )}

        <div className="rstr-sanity-stack rstr-sanity-gap-2">
          {onPick !== undefined && (
            <Button
              mode="default"
              tone="primary"
              fontSize={1}
              padding={3}
              // Until a promote finishes, the asset's URL may still serve the previous default,
              // and that is what Sanity would fetch and store.
              disabled={!ready || busy === "promote"}
              onClick={() => onPick(item)}
              text={pickLabel}
            />
          )}

          {canPromote && (
            <Button
              mode="ghost"
              fontSize={1}
              padding={3}
              icon={PublishIcon}
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
              icon={UploadIcon}
              disabled={busy !== null}
              onClick={onUploadVariant}
              text="Add a variant"
            />
          )}

          <div className="rstr-sanity-row rstr-sanity-gap-2">
            {fullSize !== null && (
              <Button
                mode="bleed"
                fontSize={1}
                padding={2}
                icon={ClipboardIcon}
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
                icon={LaunchIcon}
                text="Open in Raster"
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
