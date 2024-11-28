
"use client"

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Connection,
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'

export const generateIDL = (serviceInterfaces:any) => {
  let idl = 'package studio.ai\n\n';

  serviceInterfaces.forEach((service:any, index:any) => {
    idl += `interface ${service.name} {\n`;
    idl += '    version { major 1 minor 0 }\n\n';

    // Add attributes (fields)
    if (service.fields && service.fields.length > 0) {
      service.fields.forEach((field:any) => {
        idl += '    attribute {\n';
        const typeMap:any = {
          "uint16": "UInt16",
          "uint8": "UInt8",
          "uint32": "UInt32",
          "uint64": "UInt64",
          "int8": "Int8",
          "int16": "Int16",
          "int32": "Int32",
          "int64": "Int64",
          "int": "UInt8",
          "boolean": "Boolean",
          "float": "Float",
          "double": "Double",
          "string": "String",
          "object": (name:any) => `${name}Struct`
        };
        const correctedType = typeMap[field.type] 
          ? (typeof typeMap[field.type] === 'function' ? typeMap[field.type](field.name) : typeMap[field.type])
          : field.type;
        idl += `        ${correctedType} ${field.name}\n`;
        idl += '    }\n\n';
      });
    }

    // Add methods
    service.methods.forEach((method:any) => {
      idl += `    method ${method.name}`;
      if (method.type === 'FireForget') {
        idl += ' fireAndForget';
      }
      idl += ' {\n';
      if (method.input && method.input.length > 0) {
        idl += '        in {\n';
        method.input.forEach((input:any) => {
          const typeMap:any = {
            "uint16": "UInt16",
            "uint8": "UInt8",
            "uint32": "UInt32",
            "uint64": "UInt64",
            "int8": "Int8",
            "int16": "Int16",
            "int32": "Int32",
            "int64": "Int64",
            "int": "UInt8",
            "boolean": "Boolean",
            "float": "Float",
            "double": "Double",
            "string": "String",
            "object": (name:any) => `${name}Struct`
          };
          const correctedType = typeMap[input.type] 
            ? (typeof typeMap[input.type] === 'function' ? typeMap[input.type](input.name) : typeMap[input.type])
            : input.type;
          idl += `            ${correctedType} ${input.name}\n`;
        });
        idl += '        }\n';
      }
      if (method.output && method.output.length > 0) {
        idl += '        out {\n';
        method.output.forEach((output:any) => {
          const typeMap:any = {
            "uint16": "UInt16",
            "uint8": "UInt8",
            "uint32": "UInt32",
            "uint64": "UInt64",
            "int8": "Int8",
            "int16": "Int16",
            "int32": "Int32",
            "int64": "Int64",
            "int": "UInt8",
            "boolean": "Boolean",
            "float": "Float",
            "double": "Double",
            "string": "String",
            "object": (name:any) => `${name}Struct`
          };
          const correctedType = typeMap[output.type] 
            ? (typeof typeMap[output.type] === 'function' ? typeMap[output.type](output.name) : typeMap[output.type])
            : output.type;
          idl += `            ${correctedType} ${output.name}\n`;
        });
        idl += '        }\n';
      }
      idl += '    }\n\n';
    });

    // Add broadcasts (events)
    service.events.forEach((event:any) => {
      idl += `    broadcast ${event.name} {\n`;
      idl += '        out {\n';
      event.data.forEach((data:any) => {
        const typeMap:any = {
          "uint16": "UInt16",
          "uint8": "UInt8",
          "uint32": "UInt32",
          "uint64": "UInt64",
          "int8": "Int8",
          "int16": "Int16",
          "int32": "Int32",
          "int64": "Int64",
          "int": "UInt8",
          "boolean": "Boolean",
          "float": "Float",
          "double": "Double",
          "string": "String",
          "object": (name:any) => `${name}Struct`
        };
        const correctedType = typeMap[data.type] 
          ? (typeof typeMap[data.type] === 'function' ? typeMap[data.type](data.name) : typeMap[data.type])
          : data.type;
        idl += `            ${correctedType} ${data.name}\n`;
      });
      idl += '        }\n';
      idl += '    }\n\n';
    });

    idl += '}\n\n';

    // Add deployment section
    idl += `deployment for studio.ai.${service.name} {\n`;
    idl += `    SomeIpServiceID = ${2000 + index}\n\n`;
    idl += '    instance {\n';
    idl += '        SomeIpInstanceID = 100\n';
    idl += '    }\n\n';

    // Add attribute deployments
    service.fields.forEach((field:any, fieldIndex:any) => {
      idl += `    attribute ${field.name} {\n`;
      idl += `        SomeIpGetterID = ${110 + fieldIndex * 10}\n`;
      idl += `        SomeIpSetterID = ${111 + fieldIndex * 10}\n`;
      idl += `        SomeIpNotifierID = ${112 + fieldIndex * 10}\n`;
      idl += `        SomeIpNotifierEventGroups = {${113 + fieldIndex * 10}}\n`;
      idl += '        SomeIpAttributeReliable = false\n';
      idl += '    }\n\n';
    });

    // Add method deployments
    service.methods.forEach((method:any, methodIndex:any) => {
      idl += `    method ${method.name} {\n`;
      idl += `        SomeIpMethodID = ${32780 + methodIndex}\n`;
      idl += '        SomeIpReliable = false\n';
      idl += '    }\n\n';
    });

    // Add broadcast deployments
    service.events.forEach((event:any, eventIndex:any) => {
      idl += `    broadcast ${event.name} {\n`;
      idl += `        SomeIpEventID = ${32769 + eventIndex}\n`;
      idl += `        SomeIpEventGroups = { ${eventIndex + 1} }\n`;
      idl += '        SomeIpEventReliable = false\n';
      idl += '    }\n\n';
    });

    idl += '}\n\n';
  });

  // Add server options
  idl += `serverOptions {
    SomeIpSdUnicastAddress = "192.168.0.1"
    SomeIpSdMulticastAddress = "239.0.0.1"
    SomeIpSdPort = 35000
    SomeIpSdInitialDelayMin = 20
    SomeIpSdInitialDelayMax = 500
    SomeIpSdRepetitionsBaseDelay = 1200
    SomeIpSdRepetitionsMax = 3
    SomeIpSdTTL = 3000
    SomeIpSdCyclicOfferDelay = 200
    SomeIpSdofferDebounceTime = 200
}\n`;

  return idl;
};

export const downloadIDL = (idl:any) => {
    const blob = new Blob([idl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service_interfaces.fidl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  export const NodeLabel = ({ type }:any) => (
    <div className="absolute top-0 left-0 px-2 py-1 text-xs font-semibold text-white rounded-tl-md rounded-br-md" style={{
      backgroundColor: type === 'serviceInterface' ? '#3b82f6' :
                       type === 'method' ? '#10b981' :
                       type === 'field' ? '#f59e0b' :
                       '#ef4444'
    }}>
      {type === 'serviceInterface' ? 'Service' :
       type === 'method' ? 'Method' :
       type === 'field' ? 'Field' :
       'Event'}
    </div>
  )
  
  export const ServiceInterfaceNode = ({ data }:any) => (
    <div className="relative px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-200 w-80">
      <NodeLabel type="serviceInterface" />
      <div className="font-bold text-lg border-b border-blue-200 pb-2 mb-2 mt-6">{data.name}</div>
      <div className="text-sm mb-2">Module: {data.module}</div>
      <div className="text-sm mb-2">{data.description}</div>
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-blue-500" />
    </div>
  )
  
  export const MethodNode = ({ data }:any) => (
    <div className="relative px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-200 w-72">
      <NodeLabel type="method" />
      <div className="font-bold border-b border-green-200 pb-2 mb-2 mt-6">{data.name}</div>
      <div className="text-sm mb-2">Type: {data.type}</div>
      <div className="text-sm mb-2">{data.description}</div>
      <div className="text-sm">
        <div className="font-medium mb-1">Input:</div>
        <ul className="list-disc list-inside mb-2">
          {data.input && data.input.map((input:any, index:number) => (
            <li key={index}>{input.name}: {input.type}</li>
          ))}
        </ul>
        {data.output && data.output.length > 0 && (
          <>
            <div className="font-medium mb-1">Output:</div>
            <ul className="list-disc list-inside">
              {data.output.map((output:any, index:number) => (
                <li key={index}>{output.name}: {output.type}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="w-16 !bg-green-500" />
    </div>
  )
  
  export const FieldNode = ({ data }:any) => (
    <div className="relative px-4 py-2 shadow-md rounded-md bg-yellow-50 border-2 border-yellow-200 w-64">
      <NodeLabel type="field" />
      <div className="font-bold border-b border-yellow-200 pb-2 mb-2 mt-6">{data.name}</div>
      <div className="text-sm mb-2">Type: {data.type}</div>
      <div className="text-sm mb-2">{data.description}</div>
      <div className="text-sm">
        Supports: {data.supports && data.supports.join(', ')}
      </div>
      <Handle type="target" position={Position.Top} className="w-16 !bg-yellow-500" />
    </div>
  )
  
  export const EventNode = ({ data }:any) => (
    <div className="relative px-4 py-2 shadow-md rounded-md bg-red-50 border-2 border-red-200 w-64">
      <NodeLabel type="event" />
      <div className="font-bold border-b border-red-200 pb-2 mb-2 mt-6">{data.name}</div>
      <div className="text-sm mb-2">{data.description}</div>
      <div className="text-sm">
        <div className="font-medium mb-1">Data:</div>
        <ul className="list-disc list-inside">
          {data.data && data.data.map((item:any, index:number) => (
            <li key={index}>{item.name}: {item.type}</li>
          ))}
        </ul>
      </div>
      <Handle type="target" position={Position.Top} className="w-16 !bg-red-500" />
    </div>
  )
  
  export const createNodes = (serviceInterfaces:any) => {
    const nodes: Node[] = []
    const edges: Edge[] = []
  
    serviceInterfaces.forEach((service:any, serviceIndex:any) => {
      const serviceNode: Node = {
        id: `service-${serviceIndex}`,
        type: 'serviceInterface',
        data: service,
        position: { x: 0, y: 0 }
      }
      nodes.push(serviceNode)
  
      if (service.methods && Array.isArray(service.methods)) {
        service.methods.forEach((method:any, methodIndex:any) => {
          const methodNode: Node = {
            id: `method-${serviceIndex}-${methodIndex}`,
            type: 'method',
            data: method,
            position: { x: 0, y: 0 }
          }
          nodes.push(methodNode)
          edges.push({
            id: `edge-service-${serviceIndex}-method-${methodIndex}`,
            source: `service-${serviceIndex}`,
            target: `method-${serviceIndex}-${methodIndex}`,
            animated: true
          })
        })
      }
  
      if (service.fields && Array.isArray(service.fields)) {
        service.fields.forEach((field:any, fieldIndex:any) => {
          const fieldNode: Node = {
            id: `field-${serviceIndex}-${fieldIndex}`,
            type: 'field',
            data: field,
            position: { x: 0, y: 0 }
          }
          nodes.push(fieldNode)
          edges.push({
            id: `edge-service-${serviceIndex}-field-${fieldIndex}`,
            source: `service-${serviceIndex}`,
            target: `field-${serviceIndex}-${fieldIndex}`,
            animated: true
          })
        })
      }
  
      if (service.events && Array.isArray(service.events)) {
        service.events.forEach((event:any, eventIndex:any) => {
          const eventNode: Node = {
            id: `event-${serviceIndex}-${eventIndex}`,
            type: 'event',
            data: event,
            position: { x: 0, y: 0 }
          }
          nodes.push(eventNode)
          edges.push({
            id: `edge-service-${serviceIndex}-event-${eventIndex}`,
            source: `service-${serviceIndex}`,
            target: `event-${serviceIndex}-${eventIndex}`,
            animated: true
          })
        })
      }
    })
  
    return { nodes, edges }
  }
  
 export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
  
    const nodeWidth = 300
    const nodeHeight = 200
  
    const isHorizontal = direction === 'LR'
    dagreGraph.setGraph({ rankdir: direction })
  
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
    })
  
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target)
    })
  
    dagre.layout(dagreGraph)
  
    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      node.targetPosition = isHorizontal ? Position.Left : Position.Top
      node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      }
  
      return node
    })
  
    return { nodes, edges }
  }