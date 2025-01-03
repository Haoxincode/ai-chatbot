import React, { useEffect, useRef,useState } from 'react';
import mermaid from 'mermaid';
import zenuml from '@mermaid-js/mermaid-zenuml';
import mermaidConfig from './mermaidConfig'; // 导入自定义配置
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
      mermaid.initialize(mermaidConfig);

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