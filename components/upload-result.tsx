import { Card, CardContent } from "@/components/ui/card"
import { FileText } from 'lucide-react'

interface UploadResultProps {
  result: any
}

export default function UploadResult({ result }: UploadResultProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">已上传文件</h3>
            <p className="text-sm text-muted-foreground break-all">{result.result}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

