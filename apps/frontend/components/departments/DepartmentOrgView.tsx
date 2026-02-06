'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Department } from '@/types/department';
import { Team } from '@/types/team';
import { Building2, Users, User, Crown } from 'lucide-react';

interface DepartmentOrgViewProps {
  departments: Department[];
  teams?: Team[];
  onView: (id: string) => void;
}

// Custom Node Component for Department
function DepartmentNode({ data }: any) {
  const { department, level, onClick } = data;
  const isCEO = level === 0;
  
  return (
    <div
      onClick={() => onClick(department.id)}
      className={`cursor-pointer transition-all hover:scale-105 ${
        isCEO ? 'w-80' : level === 1 ? 'w-72' : 'w-64'
      }`}
    >
      {/* Input Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: isCEO ? '#f66600' : level === 1 ? '#003087' : '#3b82f6',
          width: 14,
          height: 14,
          border: '3px solid white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}
      />
      
      <div className={`relative bg-white rounded-2xl border-2 shadow-2xl overflow-hidden ${
        isCEO
          ? 'border-[#f66600] shadow-[#f66600]/30'
          : level === 1
          ? 'border-[#003087] shadow-[#003087]/20'
          : 'border-blue-300 shadow-blue-500/10'
      }`}>
        {/* Gradient overlay */}
        <div className={`absolute inset-0 opacity-40 ${
          isCEO
            ? 'bg-gradient-to-br from-[#f66600]/20 via-orange-100/30 to-red-50/20'
            : level === 1
            ? 'bg-gradient-to-br from-[#003087]/10 via-blue-50/30 to-indigo-50/20'
            : 'bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-cyan-50/20'
        }`}></div>
        
        {/* Decorative corner accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 opacity-20 ${
          isCEO
            ? 'bg-gradient-to-bl from-[#f66600] to-transparent'
            : level === 1
            ? 'bg-gradient-to-bl from-[#003087] to-transparent'
            : 'bg-gradient-to-bl from-blue-400 to-transparent'
        }`}></div>

        <div className="relative p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-xl relative overflow-hidden ${
              isCEO
                ? 'from-[#f66600] to-orange-600 shadow-[#f66600]/50'
                : level === 1
                ? 'from-[#003087] to-blue-700 shadow-[#003087]/40'
                : 'from-blue-500 to-indigo-600 shadow-blue-500/30'
            }`}>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
              {isCEO ? (
                <Crown className="text-white" size={28} />
              ) : (
                <Building2 className="text-white" size={24} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-slate-900 ${
                isCEO ? 'text-xl' : level === 1 ? 'text-lg' : 'text-base'
              }`}>
                {department.name}
              </h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{department.code}</p>
              
              {isCEO && (
                <div className="mt-2 inline-block px-3 py-1.5 bg-gradient-to-r from-[#f66600] to-orange-600 text-white text-xs font-bold rounded-full shadow-lg shadow-[#f66600]/30 border border-white/20">
                  BAN GIÁM ĐỐC
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#f66600]/10 to-orange-50 rounded-lg border border-[#f66600]/30 shadow-sm">
              <Users size={14} className="text-[#f66600]" />
              <span className="text-xs font-bold text-[#f66600]">{department._count?.employees || 0}</span>
            </div>
            
            {department._count?.children > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#003087]/10 to-blue-50 rounded-lg border border-[#003087]/30 shadow-sm">
                <Building2 size={14} className="text-[#003087]" />
                <span className="text-xs font-bold text-[#003087]">{department._count.children}</span>
              </div>
            )}
          </div>

          {department.manager ? (
            <div className="pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003087] to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[#003087]/30 border-2 border-white">
                  {department.manager.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{department.manager.fullName}</p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{department.manager.position}</p>
                </div>
                <User size={12} className="text-[#003087]/60" />
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 px-2 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm"></div>
                <span className="text-xs font-medium">Chưa có quản lý</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Output Handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: isCEO ? '#f66600' : level === 1 ? '#003087' : '#3b82f6',
          width: 14,
          height: 14,
          border: '3px solid white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}

// Custom Node Component for Team
function TeamNode({ data }: any) {
  const { team, onClick } = data;
  
  return (
    <div
      onClick={() => onClick(team.id)}
      className="cursor-pointer transition-all hover:scale-105 w-56"
    >
      {/* Input Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#a855f7',
          width: 12,
          height: 12,
          border: '3px solid white',
          boxShadow: '0 2px 10px rgba(168, 85, 247, 0.3)',
        }}
      />
      
      <div className="relative bg-white rounded-2xl border-2 border-purple-400 shadow-2xl shadow-purple-500/30 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-pink-50/30 to-rose-50/20 opacity-50"></div>
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-400/30 to-transparent opacity-40"></div>

        <div className="relative p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl shadow-purple-500/40 relative overflow-hidden">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
              <Users className="text-white relative z-10" size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-slate-900">
                {team.name}
              </h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{team.code}</p>
              <div className="mt-1 inline-block px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-[10px] font-bold rounded-full shadow-md shadow-purple-500/30 border border-white/20">
                TEAM
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-300 shadow-sm">
              <Users size={12} className="text-purple-600" />
              <span className="text-xs font-bold text-purple-700">{team._count?.members || 0}</span>
            </div>
          </div>

          {team.teamLead ? (
            <div className="pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-purple-500/30 border-2 border-white">
                  {team.teamLead.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{team.teamLead.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Team Lead</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 px-2 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm"></div>
                <span className="text-xs font-medium">Chưa có lead</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  department: DepartmentNode,
  team: TeamNode,
};

export default function DepartmentOrgView({ departments, teams = [], onView }: DepartmentOrgViewProps) {
  const handleViewTeam = useCallback((teamId: string) => {
    window.location.href = `/dashboard/teams/${teamId}`;
  }, []);

  // Build nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Find root department (CEO)
    const rootDept = departments.find(d => d.parentId === null);
    
    if (!rootDept) {
      return { nodes: [], edges: [] };
    }

    // Layout configuration - increased spacing to prevent overlap
    const HORIZONTAL_SPACING = 450;
    const VERTICAL_SPACING = 300;
    const TEAM_VERTICAL_SPACING = 250;
    const TEAM_HORIZONTAL_SPACING = 320;
    
    // Add CEO node at top center
    nodes.push({
      id: rootDept.id,
      type: 'department',
      position: { x: 0, y: 0 },
      data: { 
        department: rootDept, 
        level: 0,
        onClick: onView,
      },
    });

    // Get child departments
    const childDepts = departments.filter(d => d.parentId === rootDept.id);
    const totalChildren = childDepts.length;
    
    // Calculate starting X position to center children
    const startX = -(totalChildren - 1) * HORIZONTAL_SPACING / 2;

    // Add child department nodes
    childDepts.forEach((dept, index) => {
      const x = startX + index * HORIZONTAL_SPACING;
      const y = VERTICAL_SPACING;
      
      nodes.push({
        id: dept.id,
        type: 'department',
        position: { x, y },
        data: { 
          department: dept, 
          level: 1,
          onClick: onView,
        },
      });

      // Add edge from CEO to department
      edges.push({
        id: `e-${rootDept.id}-${dept.id}`,
        source: rootDept.id,
        target: dept.id,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: '#003087',
          strokeWidth: 4,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#003087',
          width: 24,
          height: 24,
        },
      });

      // Add teams for this department
      const deptTeams = teams.filter(t => t.departmentId === dept.id);
      const totalTeams = deptTeams.length;
      
      if (totalTeams > 0) {
        const teamStartX = x - (totalTeams - 1) * TEAM_HORIZONTAL_SPACING / 2;
        
        deptTeams.forEach((team, teamIndex) => {
          const teamX = teamStartX + teamIndex * TEAM_HORIZONTAL_SPACING;
          const teamY = y + TEAM_VERTICAL_SPACING;
          
          nodes.push({
            id: team.id,
            type: 'team',
            position: { x: teamX, y: teamY },
            data: { 
              team,
              onClick: handleViewTeam,
            },
          });

          // Add edge from department to team
          edges.push({
            id: `e-${dept.id}-${team.id}`,
            source: dept.id,
            target: team.id,
            type: 'smoothstep',
            animated: false,
            style: { 
              stroke: '#a855f7',
              strokeWidth: 3,
              strokeDasharray: '5,5',
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#a855f7',
              width: 20,
              height: 20,
            },
          });
        });
      }
    });

    return { nodes, edges };
  }, [departments, teams, onView, handleViewTeam]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (initialNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Building2 size={64} className="mb-4" />
        <p className="text-lg font-medium">Không tìm thấy cấu trúc tổ chức</p>
        <p className="text-sm mt-2">Vui lòng kiểm tra dữ liệu departments</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xl" style={{ height: '800px' }}>
      <div className="p-6 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#003087] to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-[#003087]/30">
                <Building2 size={20} className="text-white" />
              </div>
              Sơ đồ tổ chức
            </h3>
            <p className="text-sm text-slate-500 ml-13">Cấu trúc phân cấp phòng ban, teams và quản lý</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#f66600]/10 to-orange-50 rounded-lg border border-[#f66600]/30">
              <div className="w-3 h-3 rounded-full bg-[#f66600]"></div>
              <span className="text-xs font-semibold text-slate-700">CEO</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#003087]/10 to-blue-50 rounded-lg border border-[#003087]/30">
              <div className="w-3 h-3 rounded-full bg-[#003087]"></div>
              <span className="text-xs font-semibold text-slate-700">Phòng ban</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-300">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs font-semibold text-slate-700">Team</span>
            </div>
          </div>
        </div>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          minZoom: 0.4,
          maxZoom: 1.2,
        }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#94a3b8" 
          gap={24} 
          size={1.5}
          style={{ opacity: 0.15 }}
        />
        <Controls 
          showInteractive={false}
          className="bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-xl shadow-xl"
        />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'team') return '#a855f7';
            if (node.data.level === 0) return '#f66600';
            return '#003087';
          }}
          className="bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-xl shadow-xl"
          maskColor="rgba(0, 0, 0, 0.08)"
        />
      </ReactFlow>
    </div>
  );
}
