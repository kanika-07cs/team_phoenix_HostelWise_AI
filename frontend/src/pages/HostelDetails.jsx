import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Building, 
  ChevronDown, 
  ChevronRight, 
  Tv, 
  Activity, 
  Eye, 
  Settings, 
  AlertTriangle,
  Lightbulb,
  Zap,
  Users,
  LayoutGrid
} from 'lucide-react';

const HostelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  
  // Selection states for filtering map display
  const [activeFloor, setActiveFloor] = useState(null);
  const [activeWing, setActiveWing] = useState(null);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const response = await api.get(`/hostels/${id}/layout`);
        setLayout(response.data);
        
        // Auto-expand the hostel and first floor by default
        const initialExpanded = { [`hostel-${response.data.id}`]: true };
        if (response.data.floors?.length > 0) {
          initialExpanded[`floor-${response.data.floors[0].id}`] = true;
          setActiveFloor(response.data.floors[0].id);
        }
        setExpandedNodes(initialExpanded);
      } catch (error) {
        console.error('Failed fetching hostel layout:', error);
        
        // Fallback mock tree layout
        const mockLayout = {
          id: parseInt(id) || 1,
          name: `Hostel ${id === '2' ? 'B' : id === '3' ? 'C' : id === '4' ? 'D' : 'A'}`,
          floors: [
            {
              id: 10,
              floor_number: 1,
              wings: [
                {
                  id: 101,
                  wing_name: 'Wing A',
                  rooms: [
                    { id: 1001, room_number: '101', capacity: 4, occupancy: 4, status: 'Occupied', power: 450, students: ['Rohan K.', 'Aman S.', 'Gourav P.', 'Nikhil D.'] },
                    { id: 1002, room_number: '102', capacity: 4, occupancy: 0, status: 'Energy Efficient', power: 25, students: [] },
                    { id: 1003, room_number: '103', capacity: 4, occupancy: 2, status: 'Abnormal', power: 780, students: ['Varun M.', 'Siddharth R.'] },
                    { id: 1004, room_number: '104', capacity: 4, occupancy: 0, status: 'Wastage', power: 310, students: [] },
                    { id: 1005, room_number: '105', capacity: 4, occupancy: 2, status: 'Maintenance', power: 0, students: ['Kabir H.', 'Aditya B.'] }
                  ]
                },
                {
                  id: 102,
                  wing_name: 'Wing B',
                  rooms: [
                    { id: 1006, room_number: '106', capacity: 4, occupancy: 3, status: 'Occupied', power: 410, students: ['Harsh J.', 'Tarun S.', 'Ritvik P.'] },
                    { id: 1007, room_number: '107', capacity: 4, occupancy: 0, status: 'Energy Efficient', power: 12, students: [] },
                    { id: 1008, room_number: '108', capacity: 4, occupancy: 1, status: 'Occupied', power: 220, students: ['Sohail M.'] },
                    { id: 1009, room_number: '109', capacity: 4, occupancy: 0, status: 'Wastage', power: 280, students: [] },
                    { id: 1010, room_number: '110', capacity: 4, occupancy: 4, status: 'Occupied', power: 510, students: ['Piyush D.', 'Lakshay R.', 'Yash V.', 'Kartik S.'] }
                  ]
                }
              ]
            },
            {
              id: 20,
              floor_number: 2,
              wings: [
                {
                  id: 201,
                  wing_name: 'Wing A',
                  rooms: [
                    { id: 2001, room_number: '201', capacity: 4, occupancy: 2, status: 'Occupied', power: 350, students: ['Akash P.', 'Dev K.'] },
                    { id: 2002, room_number: '202', capacity: 4, occupancy: 0, status: 'Energy Efficient', power: 15, students: [] },
                    { id: 2003, room_number: '203', capacity: 4, occupancy: 4, status: 'Abnormal', power: 920, students: ['Rahul G.', 'Tushar H.', 'Ishaan J.', 'Pranav L.'] },
                    { id: 2004, room_number: '204', capacity: 4, occupancy: 0, status: 'Wastage', power: 410, students: [] },
                    { id: 2005, room_number: '205', capacity: 4, occupancy: 3, status: 'Occupied', power: 380, students: ['Dhruv S.', 'Karan M.', 'Arjun T.'] }
                  ]
                },
                {
                  id: 202,
                  wing_name: 'Wing B',
                  rooms: [
                    { id: 2006, room_number: '206', capacity: 4, occupancy: 4, status: 'Occupied', power: 480, students: ['Ayush N.', 'Sameer D.', 'Nishant G.', 'Uday F.'] },
                    { id: 2007, room_number: '207', capacity: 4, occupancy: 0, status: 'Energy Efficient', power: 10, students: [] },
                    { id: 2008, room_number: '208', capacity: 4, occupancy: 0, status: 'Energy Efficient', power: 15, students: [] },
                    { id: 2009, room_number: '209', capacity: 4, occupancy: 2, status: 'Occupied', power: 340, students: ['Ankit R.', 'Gopal T.'] },
                    { id: 2010, room_number: '210', capacity: 4, occupancy: 1, status: 'Occupied', power: 190, students: ['Puneet B.'] }
                  ]
                }
              ]
            }
          ]
        };
        setLayout(mockLayout);
        setActiveFloor(mockLayout.floors[0].id);
        setExpandedNodes({ [`hostel-${mockLayout.id}`]: true, [`floor-${mockLayout.floors[0].id}`]: true });
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [id]);

  const toggleNode = (nodeKey) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeKey]: !prev[nodeKey]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Occupied': return 'bg-brand-primary text-white border-transparent';
      case 'Energy Efficient': return 'bg-brand-success text-white border-transparent';
      case 'Abnormal': return 'bg-brand-warning text-white border-transparent';
      case 'Wastage': return 'bg-brand-danger text-white border-transparent';
      default: return 'bg-slate-400 text-white border-transparent'; // Maintenance
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Occupied': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary/10 text-brand-primary">Occupied</span>;
      case 'Energy Efficient': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-success/10 text-brand-success">Energy Efficient</span>;
      case 'Abnormal': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-warning/10 text-brand-warning">Abnormal Load</span>;
      case 'Wastage': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-danger/10 text-brand-danger">Energy Wastage</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Maintenance</span>;
    }
  };

  const getRecommendation = (room) => {
    if (room.status === 'Wastage') {
      return {
        action: 'Turn OFF lighting & fans immediately',
        detail: 'Room is occupied by 0 students but consuming 300W+. Recommend supervisor check.',
        saving: 'Approx. 1.2 kWh / hour'
      };
    }
    if (room.status === 'Abnormal') {
      return {
        action: 'Check heavy appliance usage',
        detail: 'Power reading of 700W+ exceeds standard capacity load. Possible induction heater or cooler detected.',
        saving: 'Approx. 2.4 kWh / hour'
      };
    }
    if (room.status === 'Energy Efficient') {
      return {
        action: 'No Action Needed',
        detail: 'Smart energy automation system has optimized all parameters for empty state.',
        saving: '0 kWh'
      };
    }
    return {
      action: 'Baseline monitoring',
      detail: 'Standard loads active. System is tracking regular occupancy metrics.',
      saving: '0.1 kWh'
    };
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-700 rounded-premium-sm" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-premium" />
          <div className="lg:col-span-3 h-96 bg-slate-200 dark:bg-slate-700 rounded-premium" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider block mb-1">AI Campus Digital Twin</span>
          <h2 className="text-2xl font-black text-brand-textPrimary dark:text-dark-textPrimary tracking-tight flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-primary" />
            {layout.name} Control Panel
          </h2>
        </div>
        <button 
          onClick={() => navigate('/hostels')}
          className="text-xs font-bold text-brand-textSecondary hover:text-brand-primary bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border px-4 py-2 rounded-premium-sm shadow-premium"
        >
          Back to Hostels
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Expandable Layout Tree Panel */}
        <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium max-h-[650px] overflow-y-auto">
          <h3 className="font-extrabold text-sm text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-4 border-b border-brand-border dark:border-dark-border pb-2.5">
            Hierarchy Tree
          </h3>
          
          <div className="space-y-1">
            {/* Hostel Root Node */}
            <div>
              <div 
                onClick={() => toggleNode(`hostel-${layout.id}`)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-brand-bg dark:hover:bg-slate-700 cursor-pointer font-bold text-sm text-brand-primary"
              >
                {expandedNodes[`hostel-${layout.id}`] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Building className="w-4 h-4" />
                <span>{layout.name}</span>
              </div>

              {expandedNodes[`hostel-${layout.id}`] && (
                <div className="pl-6 space-y-1 mt-1">
                  {layout.floors.map(floor => (
                    <div key={floor.id}>
                      {/* Floor Node */}
                      <div 
                        onClick={() => {
                          toggleNode(`floor-${floor.id}`);
                          setActiveFloor(floor.id);
                          setActiveWing(null);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-brand-bg dark:hover:bg-slate-700 cursor-pointer text-xs font-bold ${activeFloor === floor.id ? 'bg-brand-veryLightBlue/50 text-brand-primary dark:bg-slate-700' : 'text-brand-textPrimary dark:text-dark-textPrimary'}`}
                      >
                        <div className="flex items-center gap-2">
                          {expandedNodes[`floor-${floor.id}`] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>Floor {floor.floor_number}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 font-medium">
                          {floor.wings.length} Wings
                        </span>
                      </div>

                      {expandedNodes[`floor-${floor.id}`] && (
                        <div className="pl-6 space-y-1 mt-1">
                          {floor.wings.map(wing => (
                            <div key={wing.id}>
                              {/* Wing Node */}
                              <div 
                                onClick={() => {
                                  toggleNode(`wing-${wing.id}`);
                                  setActiveFloor(floor.id);
                                  setActiveWing(wing.id);
                                }}
                                className={`flex items-center justify-between px-2.5 py-1 rounded-lg hover:bg-brand-bg dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold ${activeWing === wing.id ? 'bg-brand-primary/10 text-brand-primary dark:bg-slate-700' : 'text-brand-textSecondary dark:text-dark-textSecondary'}`}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedNodes[`wing-${wing.id}`] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  <span>{wing.wing_name}</span>
                                </div>
                                <span className="text-[10px] text-brand-primary font-bold">
                                  {wing.rooms.length} R
                                </span>
                              </div>

                              {/* Room Nodes list */}
                              {expandedNodes[`wing-${wing.id}`] && (
                                <div className="pl-6 space-y-0.5 mt-0.5">
                                  {wing.rooms.map(room => (
                                    <div 
                                      key={room.id}
                                      onClick={() => setSelectedRoom(room)}
                                      className={`flex items-center justify-between px-3 py-1 rounded-md hover:bg-brand-bg dark:hover:bg-slate-700 cursor-pointer text-[11px] font-medium ${selectedRoom?.id === room.id ? 'bg-brand-primary text-white font-bold' : 'text-brand-textSecondary'}`}
                                    >
                                      <span>Room {room.room_number}</span>
                                      <span className={`w-1.5 h-1.5 rounded-full ${room.status === 'Occupied' ? 'bg-brand-primary' : room.status === 'Energy Efficient' ? 'bg-brand-success' : room.status === 'Abnormal' ? 'bg-brand-warning' : room.status === 'Wastage' ? 'bg-brand-danger' : 'bg-slate-400'}`} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2D Digital Twin Layout Map & Tooltip details */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Map Filters & Legends */}
          <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-4 rounded-premium shadow-premium flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-brand-textSecondary flex items-center gap-1.5 mr-2">
                <LayoutGrid className="w-4.5 h-4.5" /> Legends:
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-textPrimary dark:text-dark-textPrimary">
                <span className="w-3 h-3 rounded bg-brand-primary" /> Occupied
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-textPrimary dark:text-dark-textPrimary">
                <span className="w-3 h-3 rounded bg-brand-success" /> Energy Efficient
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-textPrimary dark:text-dark-textPrimary">
                <span className="w-3 h-3 rounded bg-brand-warning" /> Abnormal Consumption
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-textPrimary dark:text-dark-textPrimary">
                <span className="w-3 h-3 rounded bg-brand-danger animate-pulse" /> Energy Wastage
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-textPrimary dark:text-dark-textPrimary">
                <span className="w-3 h-3 rounded bg-slate-400" /> Maintenance
              </span>
            </div>
          </div>

          {/* Interactive grid maps representing selected floor layout */}
          <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-8 rounded-premium shadow-premium relative min-h-[400px]">
            {activeFloor ? (
              (() => {
                const floorNode = layout.floors.find(f => f.id === activeFloor);
                if (!floorNode) return <p>No floor found</p>;
                return (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center border-b border-brand-border dark:border-dark-border pb-4">
                      <h4 className="font-extrabold text-brand-textPrimary dark:text-dark-textPrimary text-base">
                        Floor {floorNode.floor_number} Layout Map
                      </h4>
                      <span className="text-xs text-brand-textSecondary dark:text-dark-textSecondary font-semibold">
                        Hover a room card for live stats. Click for AI Recommendations.
                      </span>
                    </div>

                    {/* Render Wing Segments side-by-side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {floorNode.wings.map(wing => (
                        <div 
                          key={wing.id} 
                          className={`p-5 rounded-premium-sm border ${activeWing === wing.id ? 'border-brand-primary bg-brand-primary/5 dark:bg-slate-700/30' : 'border-brand-border dark:border-dark-border bg-brand-bg dark:bg-slate-900'} transition-all duration-300`}
                        >
                          <span className="text-xs font-black text-brand-primary dark:text-brand-accent uppercase tracking-wider block mb-4">{wing.wing_name}</span>
                          
                          {/* Room rounded block list */}
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3.5">
                            {wing.rooms.map(room => (
                              <div
                                key={room.id}
                                onMouseEnter={() => setHoveredRoom(room)}
                                onMouseLeave={() => setHoveredRoom(null)}
                                onClick={() => setSelectedRoom(room)}
                                className={`w-full aspect-square rounded-premium-sm flex flex-col justify-center items-center cursor-pointer shadow-premium hover:scale-105 border-2 ${selectedRoom?.id === room.id ? 'border-brand-textPrimary dark:border-white scale-102 ring-4 ring-brand-primary/10' : 'border-transparent'} ${getStatusColor(room.status)} hover-card relative`}
                              >
                                <span className="text-sm font-extrabold">{room.room_number}</span>
                                <span className="text-[9px] font-bold opacity-80 mt-1 flex items-center gap-0.5">
                                  <Users className="w-2.5 h-2.5" />
                                  {room.occupancy}/{room.capacity || 4}
                                </span>
                                {room.status === 'Wastage' && (
                                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-200 border border-brand-danger live-indicator" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-brand-textSecondary">
                Select a floor from the layout tree to initialize the 2D Map Twin.
              </div>
            )}

            {/* Hover Tooltip Modal */}
            {hoveredRoom && (
              <div className="absolute top-4 right-4 w-72 bg-white dark:bg-slate-900 border border-brand-border dark:border-dark-border p-4 rounded-premium-sm shadow-premium z-20 space-y-3">
                <div className="flex justify-between items-center border-b border-brand-border dark:border-dark-border pb-2">
                  <span className="text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary">Room {hoveredRoom.room_number} Quick Stats</span>
                  {getStatusBadge(hoveredRoom.status)}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-brand-textSecondary dark:text-dark-textSecondary font-semibold">Occupants present:</span>
                    <strong className="text-brand-textPrimary dark:text-dark-textPrimary">{hoveredRoom.occupancy} / {hoveredRoom.capacity || 4}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-textSecondary dark:text-dark-textSecondary font-semibold">Active Power Draw:</span>
                    <strong className="text-brand-primary font-extrabold flex items-center gap-0.5">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      {hoveredRoom.power || (hoveredRoom.status === 'Wastage' ? 310 : hoveredRoom.status === 'Abnormal' ? 780 : hoveredRoom.status === 'Occupied' ? 420 : 15)} W
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-textSecondary dark:text-dark-textSecondary font-semibold">Expected Baseline:</span>
                    <strong className="text-brand-textPrimary dark:text-dark-textPrimary">
                      {hoveredRoom.status === 'Occupied' || hoveredRoom.status === 'Abnormal' ? 350 : 20} W
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Room Details card & AI Action suggestions */}
          {selectedRoom && (
            <div className="bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border p-6 rounded-premium shadow-premium grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="absolute top-[-50%] left-[-10%] w-[300px] h-[300px] bg-brand-primary/5 blur-[80px] pointer-events-none" />
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="p-2.5 rounded-premium-sm bg-brand-veryLightBlue text-brand-primary">
                    <Tv className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-brand-textPrimary dark:text-dark-textPrimary">Room {selectedRoom.room_number} Console</h3>
                    <span className="text-[10px] font-bold text-brand-textSecondary dark:text-dark-textSecondary uppercase tracking-wider block mt-0.5">Live configuration parameters</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between text-sm py-1.5 border-b border-brand-border dark:border-dark-border">
                    <span className="font-medium text-brand-textSecondary dark:text-dark-textSecondary">State Class</span>
                    {getStatusBadge(selectedRoom.status)}
                  </div>
                  <div className="flex justify-between text-sm py-1.5 border-b border-brand-border dark:border-dark-border">
                    <span className="font-medium text-brand-textSecondary dark:text-dark-textSecondary">Occupancy Count</span>
                    <span className="font-extrabold text-brand-textPrimary dark:text-dark-textPrimary">{selectedRoom.occupancy} / {selectedRoom.capacity || 4} students</span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5 border-b border-brand-border dark:border-dark-border">
                    <span className="font-medium text-brand-textSecondary dark:text-dark-textSecondary">Active Wattage Draw</span>
                    <span className="font-extrabold text-brand-primary flex items-center gap-0.5">
                      <Zap className="w-4 h-4 fill-current" />
                      {selectedRoom.power || (selectedRoom.status === 'Wastage' ? 310 : selectedRoom.status === 'Abnormal' ? 780 : selectedRoom.status === 'Occupied' ? 420 : 15)} W
                    </span>
                  </div>
                  
                  {/* Students allocated names */}
                  <div className="mt-2">
                    <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-2">Allocated Room Students</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoom.students && selectedRoom.students.length > 0 ? (
                        selectedRoom.students.map((st, index) => (
                          <span key={index} className="text-xs px-2.5 py-1 rounded bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border text-brand-textPrimary dark:text-dark-textPrimary font-semibold">{st}</span>
                        ))
                      ) : (
                        <span className="text-xs text-brand-textSecondary italic">No students allocated. Room is currently unassigned.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Action Card details */}
              <div className="p-5 rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-lightBlue/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4.5 h-4.5 text-brand-primary" />
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">AI Operations Suggestion</span>
                  </div>
                  <h4 className="font-black text-sm text-brand-textPrimary dark:text-dark-textPrimary mb-1.5">{getRecommendation(selectedRoom).action}</h4>
                  <p className="text-xs text-brand-textSecondary dark:text-dark-textSecondary leading-relaxed">{getRecommendation(selectedRoom).detail}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-brand-border dark:border-dark-border flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider">Estimated Hourly Saving</span>
                    <span className="text-sm font-extrabold text-brand-success">{getRecommendation(selectedRoom).saving}</span>
                  </div>
                  <button 
                    onClick={() => {
                      alert(`Dispatched automated override request for Room ${selectedRoom.room_number}`);
                    }}
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-premium-sm shadow-premium transition-all duration-200"
                  >
                    Apply Override
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default HostelDetails;
