module.exports = {
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
  zenuml: {
    nodeSpacing: 50,
    rankSpacing: 80,
    layoutDirection: 'TB',
    useMaxWidth: false,
    wrap: true,
    fontSize: 14,
    fontFamily: 'Arial',
    curve: 'basis',
  },
    nodeSpacing: 50,
    // 增加层级间距
    rankSpacing: 80,
    // 设置布局方向
    layoutDirection: 'TB', // TB: top to bottom
    // 启用紧凑布局
    useMaxWidth: false,
  };
  