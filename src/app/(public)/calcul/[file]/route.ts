import { NextResponse } from "next/server";
import { calculFiles, loadCalculHtml } from "@/lib/calcul-tools";

type Props = {
  params: Promise<{
    file: string;
  }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { file } = await params;
  const tool = calculFiles.find((item) => item.filename === file);

  if (!tool) {
    return new NextResponse("Not found", { status: 404 });
  }

  const html = await loadCalculHtml(tool.filename);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
