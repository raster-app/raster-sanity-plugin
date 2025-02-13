export const pickerStyles = {
  container: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "2.5rem",
    height: "100%",
    backgroundColor: "white",
    padding: "1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
  content: {
    display: "flex",
    gap: "2rem",
    height: "calc(100% - 60px)",
    overflow: "hidden",
  },
  previewContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
    width: "100%",
    overflow: "auto",
  },
  divider: {
    margin: "0.5rem 0",
    border: "none",
    borderTop: "1px solid #e5e7eb",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
    position: "absolute" as const,
    bottom: "1rem",
    right: "1rem",
  },
};
