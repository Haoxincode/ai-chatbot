import React, { useEffect, useRef,useState } from 'react';
import mermaid from 'mermaid';
import zenuml from '@mermaid-js/mermaid-zenuml';
interface Props {
  chart: string
}



const Mermaid: React.FC<Props> = ({ chart }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [init,showInit]= useState(false)
  useEffect( () => {
    if (chartRef.current && chart) {
       initChart()
    }
  }, [chart]);

  
  const initChart = async() => {
    if (chartRef.current) {
      // 注册外部图表
      mermaid.registerExternalDiagrams([zenuml]);
        
      // 初始化配置
      mermaid.initialize({
        startOnLoad: true,
            theme: "base",
            themeVariables: {
            "primaryColor": "hsl(240, 5.9%, 10%)",
            "primaryTextColor": "hsl(0, 0%, 0%)",
            "lineColor": "hsl(240, 5.9%, 10%)",
            "background": "hsl(0, 0%, 100%)",
            "tertiaryColor": "hsl(240, 4.8%, 95.9%)",
            "tertiaryTextColor": "hsl(0, 0%, 0%)",
            "nodeTextColor": "hsl(0, 0%, 0%)",
            "mainBkg": "hsl(0, 0%, 100%)",
            "secondBkg": "hsl(240, 4.8%, 95.9%)",
            "edgeLabelBackground": "hsl(0, 0%, 100%)",
            "clusterBkg": "hsl(240, 4.8%, 95.9%)",
            "quadrantPointFill":"hsl(240, 5.9%, 10%)"
        },
        
      logLevel: 'error',
      securityLevel: 'loose',
      // zenuml: {
      //   nodeSpacing: 50,
      //   rankSpacing: 80,
      //   layoutDirection: 'TB',
      //   useMaxWidth: false,
      //   wrap: true,
      //   fontSize: 14,
      //   fontFamily: 'Arial',
      //   curve: 'basis',
      // },
      //   nodeSpacing: 50,
      //   // 增加层级间距
      //   rankSpacing: 80,
      //   // 设置布局方向
      //   layoutDirection: 'TB', // TB: top to bottom
      //   // 启用紧凑布局
      //   useMaxWidth: false,
      });

      // 等待渲染完成
      await mermaid.contentLoaded();
    }
  }
  return (
    <div className='flex justify-center'>
    <div ref={chartRef} 
    className={chart.startsWith('zenuml') ? 
    "mermaid w-full flex-column items-center zenuml" : 
    "mermaid w-full flex justify-center"}
    style={{
      // 确保容器有足够的空间
      minHeight: '200px',
      // 添加最小宽度
      minWidth: '300px',
      // 防止内容溢出
      overflow: 'auto',
      // 添加一些内边距
      padding: '20px'
    }}>
      {chart}
    </div>
    </div>
  );
};

export default Mermaid;