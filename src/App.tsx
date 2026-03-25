/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare, 
  Plus, 
  FileText, 
  LayoutDashboard, 
  Wrench, 
  RotateCcw, 
  Send, 
  Database, 
  ChevronRight, 
  Search, 
  Trash2,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  User,
  Bot,
  CheckCircle2,
  AlertCircle,
  Radar,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from './lib/utils';
import DataElfView from './components/DataElfView';
import SmartBuildView from './components/SmartBuildView';

// --- Types ---

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chartData?: any[];
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  suggestions?: string[];
  isReport?: boolean;
  isLoading?: boolean;
};

type HistoryItem = {
  id: string;
  title: string;
};

// --- Mock Data & Logic ---

const MOCK_REGIONS = ['苏北区', '苏南区', '全局'];

const HEALTH_DATA = {
  '苏北区': { income: 85, profit: 45, service: 92, ability: 30, trend: [65, 70, 85, 80, 85] },
  '苏南区': { income: 95, profit: 88, service: 85, ability: 90, trend: [80, 85, 90, 92, 95] },
  '全局': { income: 88, profit: 60, service: 88, ability: 65, trend: [75, 78, 82, 85, 88] },
};

const FEE_DATA = [
  { name: '营销费用', value: 450, color: '#3b82f6' },
  { name: '人工费用', value: 300, color: '#10b981' },
  { name: '物料费用', value: 150, color: '#f59e0b' },
  { name: '其他费用', value: 100, color: '#6366f1' },
];

const getAIResponse = async (input: string, history: Message[]): Promise<Partial<Message>> => {
  const lowerInput = input.toLowerCase();
  
  // Scenario 1 & 2: Health Overview
  if (lowerInput.includes('健康度') && (lowerInput.includes('苏北') || lowerInput.includes('苏南') || lowerInput.includes('整体') || lowerInput.includes('全局'))) {
    const region = lowerInput.includes('苏北') ? '苏北区' : lowerInput.includes('苏南') ? '苏南区' : '全局';
    const data = HEALTH_DATA[region as keyof typeof HEALTH_DATA];
    
    return {
      content: `${region}本期健康度评估：收入稳定（${data.income}分）、利润${data.profit < 50 ? '下滑' : '良好'}（${data.profit}分）、服务优质（${data.service}分）、能力${data.ability < 50 ? '偏弱' : '较强'}（${data.ability}分）。${data.profit < 50 ? '建议重点关注利润维度的费用控制。' : '整体经营状况稳健。'}`,
      chartType: 'bar',
      chartData: [
        { name: '收入', value: data.income },
        { name: '利润', value: data.profit },
        { name: '服务', value: data.service },
        { name: '能力', value: data.ability },
      ],
      suggestions: ['利润下滑原因？', '哪个费用涨幅最大？', '查看趋势图']
    };
  }

  // Scenario 1 & 2: Profit/Fee Drill down
  if (lowerInput.includes('利润') && (lowerInput.includes('原因') || lowerInput.includes('下滑'))) {
    return {
      content: "检索到利润下降主要由于运营费用高企，特别是营销费用同比增长20%，是主要驱动因素。以下是费用构成明细：",
      chartType: 'pie',
      chartData: FEE_DATA,
      suggestions: ['营销费用如何？', '物料费用情况', '建议优化方案']
    };
  }

  if (lowerInput.includes('营销费用')) {
    return {
      content: "营销费用本月支出450万元，同比增长20%。主要投入在苏北区的促销活动中，ROI目前为1.2，略低于预期目标1.5。",
      chartType: 'line',
      chartData: [
        { name: '1月', value: 320 },
        { name: '2月', value: 350 },
        { name: '3月', value: 450 },
      ],
      suggestions: ['如何优化ROI？', '其他费用项对比']
    };
  }

  // Scenario 4: Clarification
  if (lowerInput === '收入怎么样' || lowerInput === '收入怎么样？') {
    return {
      content: "您想查询哪段时间的收入？是查看本月实时数据，还是本年累计的同比数据？",
      suggestions: ['本月收入', '本年累计收入']
    };
  }

  if (lowerInput.includes('本月收入')) {
    return {
      content: "本月全公司收入为X万元，同比增长12%，主要由苏南区和苏北区的增量业务驱动。",
      chartType: 'line',
      chartData: [
        { name: '上月', value: 1200 },
        { name: '本月', value: 1350 },
      ],
      suggestions: ['查看各区贡献度', '利润情况同步']
    };
  }

  // Scenario 3: Feed Data
  if (lowerInput.includes('喂数据') || lowerInput.includes('加载数据')) {
    return {
      content: "✅ 数据已成功加载到AI模型。当前已加载2026年3月经营数据，您可以开始提问了。建议提问：\n- 苏北区健康度如何？\n- 整体经营健康度如何？",
      suggestions: ['苏北区健康度如何？', '整体健康度如何？']
    };
  }

  // Scenario 5: Report
  if (lowerInput.includes('生成') && lowerInput.includes('报告')) {
    return {
      content: "正在为您汇总本月经营诊断报告...\n\n### 2026年3月经营健康度报告\n\n**1. 核心结论**\n全公司健康度良好，但利润增速低于目标。收入增长正常，服务指标稳定。\n\n**2. 风险预警**\n苏北区利润下滑严重，运营费用高企，需立即启动成本优化计划。\n\n**3. 改进建议**\n- 优化营销投放策略，提升ROI。\n- 严格控制非必要行政支出。\n- 加强苏北区能力建设。",
      isReport: true,
      chartType: 'bar',
      chartData: [
        { name: '收入', value: 88 },
        { name: '利润', value: 60 },
        { name: '服务', value: 88 },
        { name: '能力', value: 65 },
      ],
      suggestions: ['下载PDF报告', '发送至邮箱']
    };
  }

  // Default
  return {
    content: "抱歉，我暂时无法直接回答这个问题。您可以尝试询问：\n- 苏北区健康度如何？\n- 整体经营健康度如何？\n- 利润下滑的原因？\n- 生成经营诊断报告",
    suggestions: ['苏北区健康度如何？', '整体健康度如何？']
  };
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, disabled }: any) => (
  <button 
    onClick={disabled ? undefined : onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 text-sm transition-all rounded-lg group",
      active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50",
      disabled && "cursor-not-allowed"
    )}
  >
    <Icon size={18} className={cn(active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
    <span className="flex-1 text-left">{label}</span>
    {badge && <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-full">{badge}</span>}
  </button>
);

const ScenarioCard = ({ title, description, icon: Icon, onClick }: any) => (
  <motion.div 
    whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)' }}
    onClick={onClick}
    className="flex flex-col p-5 bg-white border border-gray-100 rounded-2xl cursor-pointer transition-all"
  >
    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
      <Icon size={20} className="text-blue-600" />
    </div>
    <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{description}</p>
  </motion.div>
);

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: '1', title: '本组织近7天理赔占收比、经手...' },
    { id: '2', title: '帮我做一个近一周的收入分析（寄件口径）' },
    { id: '3', title: '就近一周而言，本组织的主要质量问题是什么？' },
    { id: '4', title: '帮我做一个25年较去年1-9月份对比的利润分析' },
    { id: '5', title: '2月相比1月来说，收入表现如何' },
  ]);
  const [activeTab, setActiveTab] = useState('chat');
  const [currentView, setCurrentView] = useState<'home' | 'data-elf' | 'smart-build'>('home');
  const [showDiagnosisOptions, setShowDiagnosisOptions] = useState(false);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input, prefixMessages?: Message[]) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const currentMessages = prefixMessages || messages;
    const newMessages = [...currentMessages, userMsg];
    
    setMessages(newMessages);
    setInput('');

    // Simulate AI thinking
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', isLoading: true }]);

    const response = await getAIResponse(text, newMessages);
    
    setSelectedScene(null);
    setShowDiagnosisOptions(false);
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { 
        ...m, 
        ...response, 
        isLoading: false,
        id: aiMsgId 
      } : m));
    }, 800);
  };

  const startNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-gray-900 overflow-hidden">
      <Toaster position="top-center" />
      {/* --- Sidebar --- */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "bg-white flex flex-col relative z-20 overflow-hidden",
          isSidebarOpen ? "border-r border-gray-200" : "border-none"
        )}
      >
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">经营智能助手</h1>
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            新对话
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          <SidebarItem icon={FileText} label="我的报告" disabled={true} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <SidebarItem icon={Wrench} label="技能库" disabled={true} active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} />
          <SidebarItem icon={ClipboardList} label="任务管理" disabled={true} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <SidebarItem icon={LayoutDashboard} label="场景管理" disabled={true} active={activeTab === 'scenarios'} onClick={() => setActiveTab('scenarios')} />
          
          <div className="mt-8 px-4 mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">历史对话</p>
          </div>
          {history.map(item => (
            <button key={item.id} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg transition-all group">
              <MessageSquare size={14} className="text-gray-300 group-hover:text-gray-400" />
              <span className="truncate flex-1 text-left">{item.title}</span>
            </button>
          ))}
        </nav>

        {/* User profile section removed */}
      </motion.aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-white">
        {currentView === 'data-elf' ? (
          <DataElfView onBack={() => setCurrentView('home')} />
        ) : currentView === 'smart-build' ? (
          <SmartBuildView onBack={() => setCurrentView('home')} />
        ) : (
          <>
            {/* Header */}
            <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title={isSidebarOpen ? "收起侧边栏" : "展开侧边栏"}
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <h2 className="text-sm font-medium text-gray-600">新对话</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Search and Download buttons removed */}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center mt-10">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="relative mb-16 w-full max-w-3xl text-center"
                >
                  <h2 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
                    经营问数
                  </h2>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    您好 我是经营智能助手，帮您快速查询经营结果，及时解决经营问题。
                  </p>
                </motion.div>

                {/* Input Area for Empty State */}
                <div className="w-full max-w-4xl mb-16">
                  {/* Quick Actions */}
                  <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto scrollbar-hide py-1">
                    <button 
                      onClick={() => setShowDiagnosisOptions(!showDiagnosisOptions)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-sm shrink-0 border",
                        showDiagnosisOptions 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white text-gray-600 border-gray-100 hover:bg-gray-100"
                      )}
                    >
                      <Database size={14} />
                      智能问数
                    </button>
                    <button 
                      onClick={() => toast('建设中，敬请期待', { 
                        icon: <AlertCircle className="text-orange-500" size={16} />, 
                        className: 'text-orange-500 font-medium' 
                      })}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 border border-gray-100 rounded-xl text-xs font-medium hover:bg-gray-100 transition-all shadow-sm shrink-0"
                    >
                      <LayoutDashboard size={14} />
                      智能搭建
                    </button>
                    <button 
                      onClick={() => toast('建设中，敬请期待', { 
                        icon: <AlertCircle className="text-orange-500" size={16} />, 
                        className: 'text-orange-500 font-medium' 
                      })}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 border border-gray-100 rounded-xl text-xs font-medium hover:bg-gray-100 transition-all shadow-sm shrink-0"
                    >
                      <TrendingUp size={14} />
                      数据洞察
                    </button>
                  </div>

                  {/* Diagnosis Options */}
                  <AnimatePresence>
                    {showDiagnosisOptions && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { title: '集团健康经营诊断' },
                            { title: '地区健康经营诊断' },
                            { title: '经营单元健康经营诊断' },
                            { title: '职能条线健康经营诊断' },
                          ].map((opt, idx) => {
                            const isDisabled = opt.title !== '地区健康经营诊断';
                            return (
                              <button 
                                key={idx}
                                onClick={() => {
                                  if (!isDisabled) {
                                    setSelectedScene(selectedScene === opt.title ? null : opt.title);
                                  }
                                }}
                                className={cn(
                                  "flex flex-col items-center justify-center p-6 bg-white border rounded-2xl transition-all group min-h-[100px]",
                                  selectedScene === opt.title 
                                    ? "border-blue-500 shadow-md ring-2 ring-blue-500/10 bg-blue-50/30" 
                                    : "border-gray-100",
                                  !isDisabled && "hover:border-blue-400 hover:shadow-md hover:bg-blue-50/10",
                                  isDisabled && "cursor-not-allowed opacity-60"
                                )}
                              >
                                <span className={cn(
                                  "text-sm font-bold text-center leading-tight transition-colors",
                                  selectedScene === opt.title ? "text-blue-600" : "text-gray-800"
                                )}>{opt.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Input */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/5 blur-2xl group-focus-within:bg-blue-500/20 transition-all rounded-3xl" />
                    <div className="relative bg-white border border-gray-200 rounded-2xl p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:shadow-xl focus-within:shadow-blue-500/5 transition-all">
                      <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="作为经营分析专家，请查询深莞区当前的经营健康度数据，包括总体健康度评分和五维度评灯"
                        className={cn(
                          "w-full bg-transparent border-none focus:ring-0 text-sm p-3 min-h-[100px] resize-none scrollbar-hide outline-none transition-opacity"
                        )}
                      />
                      <div className="flex items-center justify-between px-2 pb-2">
                        <div className="flex items-center gap-1">
                          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                            <Plus size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setInput('')}
                            className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            清空
                          </button>
                          <button 
                            onClick={() => {
                              if (selectedScene === '地区健康经营诊断') {
                                const introMsg: Message = {
                                  id: 'intro-' + Date.now(),
                                  role: 'assistant',
                                  content: '您好，我是经营智能助手，已经接入并学习了【地区经营诊断看板数据】，你可以直接问我类似“帮我看一下华南区的健康度情况”，我会为您进行经营健康五维度体检分析',
                                };
                                handleSend(input, [introMsg]);
                              } else {
                                handleSend();
                              }
                            }}
                            disabled={!input.trim()}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              input.trim() ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-gray-100 text-gray-300"
                            )}
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question Recommendations */}
                  <div className="mt-8 w-full max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full" />
                      <h3 className="text-sm font-bold text-gray-700">问题推荐</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { q: "请结合健康度关键指标，综合分析深莞区目前的经营健康度情况", icon: Radar, color: "bg-purple-50 text-purple-600" },
                        { q: "请综合分析北京区上月收入表现", icon: BarChart3, color: "bg-blue-50 text-blue-600" },
                        { q: "请提取河北区快递物流整体收入指标的近3月数据，生成清晰的趋势图", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" }
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(item.q)}
                          className="flex items-center gap-4 group p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5 transition-all"
                        >
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.color)}>
                            <item.icon size={20} />
                          </div>
                          <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors flex-1">{item.q}</span>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                    )}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none"
                      )}>
                        {msg.isLoading ? (
                          <div className="flex gap-1 py-1">
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        )}
                      </div>

                      {/* Chart Rendering */}
                      {msg.chartData && !msg.isLoading && (
                        <div className="mt-4 w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                          <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              {msg.chartType === 'bar' ? (
                                <BarChart data={msg.chartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                  />
                                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              ) : msg.chartType === 'line' ? (
                                <LineChart data={msg.chartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                  />
                                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                                </LineChart>
                              ) : (
                                <PieChart>
                                  <Pie
                                    data={msg.chartData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {msg.chartData.map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {msg.suggestions && !msg.isLoading && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.suggestions.map((s, idx) => (
                            <button 
                              key={idx}
                              onClick={() => handleSend(s)}
                              className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-600 rounded-full hover:border-blue-400 hover:text-blue-600 transition-all"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        {messages.length > 0 && (
          <div className="px-6 pb-8 bg-white">
            <div className="max-w-4xl mx-auto">
              {/* Quick Actions */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide py-1">
                <button 
                  onClick={() => setShowDiagnosisOptions(!showDiagnosisOptions)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 border",
                    showDiagnosisOptions 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                  )}
                >
                  <Database size={14} />
                  智能问数
                </button>
                <button 
                  onClick={() => toast('建设中，敬请期待', { 
                    icon: <AlertCircle className="text-orange-500" size={16} />, 
                    className: 'text-orange-500 font-medium' 
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-100 rounded-xl text-xs font-medium hover:bg-gray-100 transition-all shrink-0"
                >
                  <LayoutDashboard size={14} />
                  智能搭建
                </button>
                <button 
                  onClick={() => toast('建设中，敬请期待', { 
                    icon: <AlertCircle className="text-orange-500" size={16} />, 
                    className: 'text-orange-500 font-medium' 
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-100 rounded-xl text-xs font-medium hover:bg-gray-100 transition-all shrink-0"
                >
                  <TrendingUp size={14} />
                  数据洞察
                </button>
              </div>

              {/* Diagnosis Options */}
              <AnimatePresence>
                {showDiagnosisOptions && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { title: '集团健康经营诊断', icon: Radar },
                        { title: '地区健康经营诊断', icon: MessageSquare },
                        { title: '经营单元健康经营诊断', icon: BarChart3 },
                        { title: '职能条线健康经营诊断', icon: PieChartIcon },
                      ].map((opt, idx) => {
                        const isDisabled = opt.title !== '地区健康经营诊断';
                        return (
                          <button 
                            key={idx}
                            onClick={() => {
                              if (!isDisabled) {
                                setSelectedScene(selectedScene === opt.title ? null : opt.title);
                              }
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 bg-white border rounded-2xl transition-all group",
                              selectedScene === opt.title 
                                ? "border-blue-500 shadow-md ring-2 ring-blue-500/10" 
                                : "border-gray-100",
                              !isDisabled && "hover:border-blue-400 hover:shadow-md",
                              isDisabled && "cursor-not-allowed"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                              selectedScene === opt.title ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600",
                              !isDisabled && "group-hover:bg-blue-100"
                            )}>
                              <opt.icon size={20} className={selectedScene === opt.title ? "text-white" : "text-blue-600"} />
                            </div>
                            <span className={cn(
                              "text-[11px] font-bold text-center leading-tight transition-colors",
                              selectedScene === opt.title ? "text-blue-600" : "text-gray-800"
                            )}>{opt.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Input */}
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/5 blur-2xl group-focus-within:bg-blue-500/20 transition-all rounded-3xl" />
                <div className="relative bg-white border border-gray-200 rounded-2xl p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:shadow-xl focus-within:shadow-blue-500/5 transition-all">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={selectedScene ? "作为资深经营分析专家，帮我看下华南分拨区上个月的经营健康度表现怎么样，有哪些弱项" : "请先点击“智能问数”并选择一个主题场景"}
                    disabled={!selectedScene}
                    className={cn(
                      "w-full bg-transparent border-none focus:ring-0 text-sm p-3 min-h-[100px] resize-none scrollbar-hide outline-none transition-opacity",
                      !selectedScene && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setInput('')}
                        className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        清空
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedScene === '地区健康经营诊断') {
                            const introMsg: Message = {
                              id: 'intro-' + Date.now(),
                              role: 'assistant',
                              content: '您好，我是经营智能助手，已经接入并学习了【地区经营诊断看板数据】，你可以直接问我类似“帮我看一下华南区的健康度情况”，我会为您进行经营健康五维度体检分析',
                            };
                            handleSend(input, [introMsg]);
                          } else {
                            handleSend();
                          }
                        }}
                        disabled={!input.trim() || !selectedScene}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          (input.trim() && selectedScene) ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-gray-100 text-gray-300"
                        )}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {/* Loading Overlay for Data Feeding removed */}
    </div>
  );
}
