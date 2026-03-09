import {
  FileCode,
  FileJson,
  FileText,
  File,
  Image,
  type LucideProps
} from "lucide-react";

/**
 * 文件图标映射类型
 */
export type FileIconComponent = React.ComponentType<LucideProps>;

/**
 * 根据文件扩展名获取对应的图标组件
 * @param filename 文件名（包含扩展名）
 * @returns 对应的图标组件
 */
export function getFileIcon(filename: string): FileIconComponent {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  const iconMap: Record<string, FileIconComponent> = {
    // 代码文件
    '.ts': FileCode,
    '.tsx': FileCode,
    '.js': FileCode,
    '.jsx': FileCode,
    '.css': FileCode,
    '.scss': FileCode,
    '.sass': FileCode,
    '.html': FileCode,
    // 配置文件
    '.json': FileJson,
    '.yaml': FileText,
    '.yml': FileText,
    '.toml': FileText,
    // 文档文件
    '.md': FileText,
    '.txt': FileText,
    // 图片文件
    '.png': Image,
    '.jpg': Image,
    '.jpeg': Image,
    '.svg': Image,
    '.gif': Image,
    '.webp': Image,
    '.ico': Image,
  };

  return iconMap[ext] || File;
}
