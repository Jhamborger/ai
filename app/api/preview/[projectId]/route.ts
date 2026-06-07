import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const files = await prisma.projectFile.findMany({
      where: { projectId },
    });

    if (files.length === 0) {
      return new NextResponse('No files found for this project', { status: 404 });
    }

    const htmlFile = files.find(f => f.path === 'index.html') || files[0];
    let html = htmlFile.content;

    // Simple bundling: Inject CSS and JS files into the HTML
    const cssFiles = files.filter(f => f.path.endsWith('.css'));
    const jsFiles = files.filter(f => f.path.endsWith('.js'));

    const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    const scripts = jsFiles.map(f => `<script>${f.content}</script>`).join('\n');

    // If it's a simple project, we can just inject them before </body>
    const bundledHtml = html.replace('</body>', `${styles}\n${scripts}\n</body>`);

    return new NextResponse(bundledHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Security-Policy': 'sandbox allow-scripts allow-forms',
      },
    });
  } catch (error: any) {
    return new NextResponse(`Preview error: ${error.message}`, { status: 500 });
  }
}
