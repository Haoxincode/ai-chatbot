import React, { useEffect, useRef,useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {ChevronsRight,ChevronsDown} from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { ImagePlay ,SquarePen, Maximize} from 'lucide-react'
import Basci from './Basic'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface MermaidProps {
  chart: string;
  setChart:Function
  data?:{title:string,desc:string},
  setData?:Function
  autoSvg?:boolean
  pro?:any
  titleEdit?:boolean
  canHide?:boolean
  className?:string
}

const Mermaid: React.FC<MermaidProps> = ({ chart ,setChart,data,setData,autoSvg,pro,titleEdit=true,canHide=true,className}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const codeRef  = useRef<HTMLTextAreaElement>(null);
  const [showSvg, setShowSvg]=useState(true)

  useEffect(() => {
    if(autoSvg != undefined){
      setShowSvg(autoSvg)
    }
  },[autoSvg])
  const changeClick = ()=>{
    setShowSvg(!showSvg)
  }

  useEffect(()=>{
    const timeout = setTimeout(() => {
      // 5 秒内没有变化，则更新 shouldRender 状态以触发重新渲染
      setShowSvg(true);
    }, 1000);

    setShowSvg(false)
    // 清除上一次的定时器，避免重复触发
    return () => clearTimeout(timeout);
  },[chart])
  const [editTitle, setEditTitle]= useState(false)
  const [title,setTitle] = useState(data?.title||'Chart')
  
  const [desc,setDesc] = useState(data?.desc||'Chart Desc')
  const [editDesc, setEditDesc]= useState(false)
  const changeEdit = (type='title')=>{
    if(type=='desc'){
      setEditDesc(true)
    }else{
      setEditTitle(true)
    }
  }
  const saveTitle=()=>{
    if(data && setData && title){
      data.title=title
      setData(data)
    }else{
      setTitle(data?.title||'Chart')
    }
    setEditTitle(false)
  }

  // const [filterChart, setFilterChart] = useState(chart)
  // useEffect(() => {
  //   const regex = /\{([^\{\}]+)\}/g;
  //   let match;
  //   console.log(JSON.stringify(chart))
  //   if(chart.trim().startsWith('classDiagram')){
  //     while ((match = regex.exec(chart))) {
  //       console.log(match[0],match[1]); // 这里的match[1]就是花括号内的内容
  //       if(match[1].trim()==''){
  //           chart=chart.replace(match[0],'').trim()
  //           setFilterChart(chart)
  //       }
  //     }
  //   }else{
  //     setFilterChart(chart.trim())
  //   }
    
  //   //console.log(JSON.stringify(chart.trim()),chart.trim())
  // },[chart])

  const filterChart=(chart:any)=>{
    const regex = /\{([^\{\}]+)\}/g;
    let match;
    if(chart.trim().startsWith('classDiagram')){
      while ((match = regex.exec(chart))) {
       // console.log(match[0],match[1]); // 这里的match[1]就是花括号内的内容
        if(match[1].trim()==''){
            chart=chart.replace(match[0],'').trim()
            
        }
      }
    }
   return chart
  }

  
  const saveDesc=()=>{
    console.log('save',desc,data)
    if(data && setData && desc){
      console.log('save',desc)
      data.desc=desc
      setData? setData(data):''
    }else{
      setDesc(data?.desc||'Chart Desc')
      
    }
    setEditDesc(false)
  }
  
  const [openstatus,setOpenStatus] = useState(true)
  return (<div>
    <Card className="w-400  relative" style={{height:openstatus?'auto':'70px',overflow:'hidden'}}>
      <CardHeader className='flex-row justify-between'>
        {title&& 
        <CardTitle className='flex  items-center text-xl ml-4 truncate font-medium'>
          {titleEdit &&'Title:'}
          {titleEdit && <span onDoubleClick={()=>{changeEdit('title')}}>
          {editTitle&& <Input
                    placeholder="Input Title"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    onBlur={saveTitle}
                    className="h-8 w-[150px] lg:w-[250px] ml-2"
                  /> }
          {!editTitle&&<span>{title}</span>}
          </span>}
          {!titleEdit&&<span className='flex'  >
          {canHide&&  <span onClick={()=>setOpenStatus(!openstatus)}>{openstatus?<ChevronsDown/>:<ChevronsRight/>}</span>}
          {title}  </span>}
        </CardTitle>}
       
        {
          showSvg && <div className='flex items-center mt-0' style={{marginTop:"0px"}}>
          <Dialog  >
          <DialogTrigger ><Maximize/> </DialogTrigger>
         
          <DialogContent className="bg-white min-w-[100vw] max-h-[100vh] overflow-auto"  >
            <DialogHeader >
              <DialogTitle>Full</DialogTitle>
              <DialogDescription>
                
              </DialogDescription>
            </DialogHeader>
            <div><Basci  chart={filterChart(chart.trim())}/></div>
            
          </DialogContent>
        </Dialog>
        <SquarePen className='cursor-pointer ml-2' onClick={changeClick}/></div> 
        }
        {
          !showSvg && <ImagePlay className='cursor-pointer float-right'  style={{marginTop:"0px"}} onClick={changeClick}/>
        }
        
        </CardHeader>

        <CardContent className={"h-full min-h-60 w-full overflow-auto "+className} >
        <CardDescription>{pro}</CardDescription>
        {
          !showSvg &&<Textarea
          onChange={(e) => setChart(e.target.value)}
          ref={codeRef}
          value={chart}
          id="message"
          rows={chart.split("\n").length >30 ? 30 :chart.split("\n").length }
          placeholder="Type your message here..."
          className="min-h-60 bg-gray-100 resize-none border-0 p-3 shadow-none focus-visible:ring-0 h-full"
        />
        }
        
        {
          showSvg &&  <Basci chart={filterChart(chart.trim())}/>
        }
          
        </CardContent>
        {canHide &&
           <div onDoubleClick={()=>{changeEdit('desc')}} className='pl-6 pb-6'>
            {editDesc&&<Textarea
          onChange={(e) => setDesc(e.target.value)}
          ref={codeRef}
          defaultValue={desc}
          onBlur={saveDesc}
          rows={chart.split("\n").length >20 ? 20 :chart.split("\n").length }/>}
            {!editDesc && <CardDescription>{desc}</CardDescription>}
           
        </div> }
    </Card>
    </div>
   
  );
};

export default Mermaid;