import { Cpu, User, ShoppingBag, DollarSign, Clock } from 'lucide-react';

export const stories = [
  { 
    name: 'Alex R.', role: 'IoT Expert', color: 'from-blue-500 to-cyan-500', 
    title: 'ESP32 Smart Door Lock Demo', description: 'Testing the new BLE integration for the smart lock prototype.',
    tags: ['#IoT', '#ESP32', '#SmartHome'], location: 'San Francisco, CA',
    thumbnail: 'https://picsum.photos/seed/cut1/800/600', likes: 1200, comments: 342,
    type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  { 
    name: 'Sarah J.', role: 'UI/UX', color: 'from-purple-500 to-pink-500', 
    title: 'Podcast: UX in Engineering', description: 'Discussing how to build better industrial software interfaces.',
    tags: ['#Podcast', '#UIUX', '#Design'], location: 'Remote',
    thumbnail: 'https://picsum.photos/seed/cut2/800/600', likes: 850, comments: 120,
    type: 'audio', audioUrl: 'https://www.w3schools.com/html/horse.mp3'
  },
  { 
    name: 'David K.', role: 'Mechanical', color: 'from-indigo-500 to-blue-500', 
    title: 'Drone PID Tuning Test', description: 'First flight test after tuning the PID controller.',
    tags: ['#Robotics', '#Drone', '#ControlSystems'], location: 'Detroit, MI',
    thumbnail: 'https://picsum.photos/seed/cut3/800/600', likes: 2100, comments: 450,
    type: 'image'
  },
  { 
    name: 'Elena M.', role: 'Embedded', color: 'from-green-500 to-emerald-500', 
    title: 'Custom PCB Assembly', description: 'Soldering the new STM32 based motor controller.',
    tags: ['#PCB', '#Embedded', '#Hardware'], location: 'Austin, TX',
    thumbnail: 'https://picsum.photos/seed/cut4/800/600', likes: 1500, comments: 230,
    type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  { 
    name: 'Michael T.', role: 'AI/ML', color: 'from-red-500 to-orange-500', 
    title: 'Computer Vision Object Detection', description: 'Testing the new YOLOv8 model on edge devices.',
    tags: ['#AI', '#ComputerVision', '#EdgeComputing'], location: 'Seattle, WA',
    thumbnail: 'https://picsum.photos/seed/cut5/800/600', likes: 3200, comments: 510,
    type: 'image'
  },
  { 
    name: 'Jessica L.', role: 'Civil', color: 'from-yellow-500 to-amber-500', 
    title: 'Bridge Load Simulation', description: 'Running FEA analysis on the new bridge design.',
    tags: ['#Civil', '#FEA', '#Simulation'], location: 'Chicago, IL',
    thumbnail: 'https://picsum.photos/seed/cut6/800/600', likes: 980, comments: 145
  },
  { 
    name: 'Ryan P.', role: 'Web Dev', color: 'from-teal-500 to-cyan-500', 
    title: 'Next.js Server Actions', description: 'Implementing server actions for form submissions.',
    tags: ['#Nextjs', '#WebDev', '#FullStack'], location: 'New York, NY',
    thumbnail: 'https://picsum.photos/seed/cut7/800/600', likes: 1100, comments: 180
  },
  { 
    name: 'Amanda C.', role: 'Robotics', color: 'from-pink-500 to-rose-500', 
    title: 'Robot Arm Kinematics', description: 'Solving inverse kinematics for the 6-DOF arm.',
    tags: ['#Robotics', '#Kinematics', '#Automation'], location: 'Boston, MA',
    thumbnail: 'https://picsum.photos/seed/cut8/800/600', likes: 2400, comments: 390
  },
  { 
    name: 'Kevin B.', role: 'IoT Expert', color: 'from-blue-600 to-indigo-600', 
    title: 'LoRaWAN Sensor Node', description: 'Deploying the first LoRaWAN node for agricultural monitoring.',
    tags: ['#IoT', '#LoRaWAN', '#AgriTech'], location: 'Denver, CO',
    thumbnail: 'https://picsum.photos/seed/cut9/800/600', likes: 1350, comments: 210
  },
  { 
    name: 'Olivia W.', role: 'AI/ML', color: 'from-purple-600 to-violet-600', 
    title: 'LLM Fine-tuning', description: 'Fine-tuning Llama 3 on custom engineering datasets.',
    tags: ['#AI', '#LLM', '#MachineLearning'], location: 'San Jose, CA',
    thumbnail: 'https://picsum.photos/seed/cut10/800/600', likes: 4100, comments: 620
  },
  { 
    name: 'Daniel H.', role: 'Mechanical', color: 'from-orange-600 to-red-600', 
    title: '3D Printed Jet Engine', description: 'Testing the 3D printed jet engine model.',
    tags: ['#3DPrinting', '#Mechanical', '#Aerospace'], location: 'Houston, TX',
    thumbnail: 'https://picsum.photos/seed/cut11/800/600', likes: 5500, comments: 890
  },
  { 
    name: 'Sophia G.', role: 'Embedded', color: 'from-emerald-600 to-teal-600', 
    title: 'FPGA Verilog Design', description: 'Implementing a custom video processing pipeline on FPGA.',
    tags: ['#FPGA', '#Verilog', '#HardwareDesign'], location: 'Portland, OR',
    thumbnail: 'https://picsum.photos/seed/cut12/800/600', likes: 1800, comments: 275
  }
];

export const initialPosts = [
  {
    id: 1, type: 'Need Post', title: 'Looking for Embedded Engineer for Smart Helmet',
    description: 'Need help integrating sensors + Bluetooth module for safety alerts. Must have experience with low-power microcontrollers.',
    meta1Label: 'Budget', meta1Value: '$2000–$3500', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '3 Weeks', meta2Icon: Clock,
    category: 'Embedded', buttonText: 'Send Offer', author: 'SafeRide Startup', time: '1h ago',
    icon: Cpu, gradient: 'from-blue-500/20 to-cyan-500/20', border: 'group-hover:border-blue-500/50'
  },
  {
    id: 2, type: 'Need Post', title: 'AI/ML Expert for Predictive Maintenance',
    description: 'Looking for a data scientist to build a predictive maintenance model for industrial HVAC systems using historical sensor data.',
    meta1Label: 'Budget', meta1Value: '$5000–$8000', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '1 Month', meta2Icon: Clock,
    category: 'AI/ML', buttonText: 'Send Offer', author: 'IndustrialTech Solutions', time: '2h ago',
    icon: Cpu, gradient: 'from-purple-500/20 to-pink-500/20', border: 'group-hover:border-purple-500/50'
  },
  {
    id: 3, type: 'Need Post', title: 'Mechanical Engineer for Drone Chassis',
    description: 'Need a lightweight, aerodynamic drone chassis designed for 3D printing. Must withstand high impact.',
    meta1Label: 'Budget', meta1Value: '$1500–$2500', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '2 Weeks', meta2Icon: Clock,
    category: 'Mechanical', buttonText: 'Send Offer', author: 'AeroDynamics Inc.', time: '3h ago',
    icon: Cpu, gradient: 'from-orange-500/20 to-red-500/20', border: 'group-hover:border-orange-500/50'
  },
  {
    id: 4, type: 'Actor Showcase', title: 'Full Stack Web Developer Available',
    description: 'Experienced in React, Node.js, and AWS. Looking for freelance projects building scalable web applications and dashboards.',
    meta1Label: 'Rate', meta1Value: '$50/hr', meta1Icon: DollarSign,
    meta2Label: 'Availability', meta2Value: '30hrs/week', meta2Icon: Clock,
    category: 'Web Dev', buttonText: 'Hire Me', author: 'Marcus Johnson', time: '4h ago',
    icon: User, gradient: 'from-teal-500/20 to-emerald-500/20', border: 'group-hover:border-teal-500/50'
  },
  {
    id: 5, type: 'Need Post', title: 'Civil Engineer for Structural Analysis',
    description: 'Require structural analysis for a new residential building design. Must be familiar with local building codes.',
    meta1Label: 'Budget', meta1Value: '$3000–$5000', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '4 Weeks', meta2Icon: Clock,
    category: 'Civil', buttonText: 'Send Offer', author: 'BuildRight Construction', time: '5h ago',
    icon: Cpu, gradient: 'from-yellow-500/20 to-amber-500/20', border: 'group-hover:border-yellow-500/50'
  },
  {
    id: 6, type: 'Supplier Product', title: 'High-Torque NEMA 23 Stepper Motors',
    description: 'Bulk supply of NEMA 23 stepper motors for CNC and robotics applications. High precision and reliability.',
    meta1Label: 'Price', meta1Value: '$45/unit', meta1Icon: DollarSign,
    meta2Label: 'Delivery', meta2Value: '2-4 Days', meta2Icon: Clock,
    category: 'Robotics', buttonText: 'View Product', author: 'MotionControl Supply', time: '6h ago',
    icon: ShoppingBag, gradient: 'from-indigo-500/20 to-blue-500/20', border: 'group-hover:border-indigo-500/50'
  },
  {
    id: 7, type: 'Need Post', title: 'IoT Developer for Smart Agriculture',
    description: 'Need an IoT expert to set up soil moisture and temperature sensors with LoRaWAN connectivity for a large farm.',
    meta1Label: 'Budget', meta1Value: '$4000–$6000', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '6 Weeks', meta2Icon: Clock,
    category: 'IoT', buttonText: 'Send Offer', author: 'GreenGrow Farms', time: '7h ago',
    icon: Cpu, gradient: 'from-green-500/20 to-emerald-500/20', border: 'group-hover:border-green-500/50'
  },
  {
    id: 8, type: 'Actor Showcase', title: 'Robotics Software Engineer',
    description: 'Specializing in ROS2, navigation stack, and sensor fusion. Available for consulting on autonomous mobile robots.',
    meta1Label: 'Rate', meta1Value: '$80/hr', meta1Icon: DollarSign,
    meta2Label: 'Availability', meta2Value: '15hrs/week', meta2Icon: Clock,
    category: 'Robotics', buttonText: 'Hire Me', author: 'Dr. Emily Chen', time: '8h ago',
    icon: User, gradient: 'from-pink-500/20 to-rose-500/20', border: 'group-hover:border-pink-500/50'
  },
  {
    id: 9, type: 'Need Post', title: 'Frontend Developer for E-commerce',
    description: 'Looking for a React developer to revamp the UI of our e-commerce platform. Must have experience with Tailwind CSS.',
    meta1Label: 'Budget', meta1Value: '$2500–$4000', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '3 Weeks', meta2Icon: Clock,
    category: 'Web Dev', buttonText: 'Send Offer', author: 'ShopNova', time: '9h ago',
    icon: Cpu, gradient: 'from-cyan-500/20 to-blue-500/20', border: 'group-hover:border-cyan-500/50'
  },
  {
    id: 10, type: 'Supplier Product', title: 'Custom PCB Fabrication Service',
    description: 'Fast turnaround PCB fabrication. Up to 6 layers, impedance control, and ENIG finish available.',
    meta1Label: 'Price', meta1Value: 'From $10', meta1Icon: DollarSign,
    meta2Label: 'Delivery', meta2Value: '5-7 Days', meta2Icon: Clock,
    category: 'Embedded', buttonText: 'View Product', author: 'CircuitMakers', time: '10h ago',
    icon: ShoppingBag, gradient: 'from-red-500/20 to-orange-500/20', border: 'group-hover:border-red-500/50'
  },
  {
    id: 11, type: 'Need Post', title: 'Computer Vision Engineer for Quality Control',
    description: 'Need a CV model to detect defects in manufactured parts on an assembly line. Real-time processing required.',
    meta1Label: 'Budget', meta1Value: '$6000–$10000', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '2 Months', meta2Icon: Clock,
    category: 'AI/ML', buttonText: 'Send Offer', author: 'AutoParts Mfg', time: '11h ago',
    icon: Cpu, gradient: 'from-violet-500/20 to-purple-500/20', border: 'group-hover:border-violet-500/50'
  },
  {
    id: 12, type: 'Actor Showcase', title: 'Mechanical Design Engineer',
    description: 'Expert in SolidWorks and Fusion 360. Available for product design, prototyping, and DFM analysis.',
    meta1Label: 'Rate', meta1Value: '$60/hr', meta1Icon: DollarSign,
    meta2Label: 'Availability', meta2Value: '25hrs/week', meta2Icon: Clock,
    category: 'Mechanical', buttonText: 'Hire Me', author: 'Liam Smith', time: '12h ago',
    icon: User, gradient: 'from-amber-500/20 to-orange-500/20', border: 'group-hover:border-amber-500/50'
  },
  {
    id: 13, type: 'Need Post', title: 'Firmware Developer for Wearable Device',
    description: 'Looking for an embedded engineer to write firmware for a new fitness tracker based on the nRF52 series.',
    meta1Label: 'Budget', meta1Value: '$4500–$7000', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '5 Weeks', meta2Icon: Clock,
    category: 'Embedded', buttonText: 'Send Offer', author: 'FitTech Wearables', time: '13h ago',
    icon: Cpu, gradient: 'from-lime-500/20 to-green-500/20', border: 'group-hover:border-lime-500/50'
  },
  {
    id: 14, type: 'Supplier Product', title: 'Industrial IoT Gateway',
    description: 'Ruggedized IoT gateway with cellular, Wi-Fi, and Ethernet connectivity. Supports Modbus and OPC UA.',
    meta1Label: 'Price', meta1Value: '$350', meta1Icon: DollarSign,
    meta2Label: 'Delivery', meta2Value: 'In Stock', meta2Icon: Clock,
    category: 'IoT', buttonText: 'View Product', author: 'ConnectEdge', time: '14h ago',
    icon: ShoppingBag, gradient: 'from-sky-500/20 to-blue-500/20', border: 'group-hover:border-sky-500/50'
  },
  {
    id: 15, type: 'Need Post', title: 'ROS Developer for Autonomous Forklift',
    description: 'Need help implementing SLAM and obstacle avoidance for an autonomous warehouse forklift using ROS.',
    meta1Label: 'Budget', meta1Value: '$8000–$12000', meta1Icon: DollarSign,
    meta2Label: 'Timeline', meta2Value: '3 Months', meta2Icon: Clock,
    category: 'Robotics', buttonText: 'Send Offer', author: 'LogisticsBot', time: '15h ago',
    icon: Cpu, gradient: 'from-fuchsia-500/20 to-pink-500/20', border: 'group-hover:border-fuchsia-500/50'
  }
];

export const engineeringNews = [
  { id: 101, title: 'ISRO launches reusable rocket prototype', content: 'The Indian Space Research Organisation successfully tested its new reusable launch vehicle, marking a significant milestone in cost-effective space exploration.', author: 'Space Weekly', time: '2h ago', category: 'Aerospace' },
  { id: 102, title: 'Tesla reveals new AI chip for Dojo supercomputer', content: 'Tesla has unveiled its next-generation AI training chip, promising a 4x increase in performance for training autonomous driving models.', author: 'Tech Insider', time: '4h ago', category: 'AI/ML' },
  { id: 103, title: 'New breakthrough in solid-state battery tech', content: 'Researchers at MIT have developed a new solid electrolyte that could double the energy density of current lithium-ion batteries.', author: 'Energy Today', time: '6h ago', category: 'Energy' },
  { id: 104, title: 'Boston Dynamics Atlas goes fully electric', content: 'The famous humanoid robot has retired its hydraulic systems in favor of fully electric actuators, increasing strength and range of motion.', author: 'Robotics News', time: '8h ago', category: 'Robotics' },
  { id: 105, title: 'OpenAI announces GPT-5 architecture details', content: 'New details emerge about the architecture of the next generation language model, focusing on improved reasoning and multi-modal capabilities.', author: 'AI Daily', time: '10h ago', category: 'AI/ML' },
  { id: 106, title: 'World\'s largest 3D printed neighborhood completed', content: 'A community of 100 3D-printed homes has been completed in Texas, showcasing the viability of additive manufacturing in construction.', author: 'Civil Eng Mag', time: '12h ago', category: 'Civil' },
  { id: 107, title: 'Raspberry Pi 5 released with PCIe support', content: 'The latest iteration of the popular single-board computer features a significant performance bump and native PCIe support for NVMe drives.', author: 'Maker Space', time: '14h ago', category: 'Embedded' },
  { id: 108, title: 'New carbon capture facility opens in Iceland', content: 'The world\'s largest direct air capture plant has begun operations, capable of removing 36,000 tons of CO2 per year.', author: 'Climate Tech', time: '16h ago', category: 'Environmental' },
  { id: 109, title: 'React 19 RC announced with new compiler', content: 'The React team has released the Release Candidate for React 19, featuring the highly anticipated React Compiler for automatic memoization.', author: 'Web Dev Weekly', time: '18h ago', category: 'Web Dev' },
  { id: 110, title: 'Breakthrough in quantum error correction', content: 'Physicists have demonstrated a new method for quantum error correction that significantly reduces the overhead required for fault-tolerant quantum computing.', author: 'Quantum Times', time: '20h ago', category: 'Physics' }
];

export const suggestedProjects = [
  { title: 'Smart Helmet Sensor Integration', budget: '$2k - $3.5k', timeline: '3 Weeks', desc: 'Need embedded engineer for BLE and sensors.' },
  { title: 'Predictive Maintenance Model', budget: '$5k - $8k', timeline: '1 Month', desc: 'Data scientist needed for HVAC sensor data.' },
  { title: '3D Printed Drone Chassis', budget: '$1.5k - $2.5k', timeline: '2 Weeks', desc: 'Mechanical design for lightweight drone.' },
  { title: 'E-commerce UI Revamp', budget: '$2.5k - $4k', timeline: '3 Weeks', desc: 'React developer needed for frontend overhaul.' },
  { title: 'Structural Analysis for Building', budget: '$3k - $5k', timeline: '4 Weeks', desc: 'Civil engineer for residential design.' },
  { title: 'Smart Farm LoRaWAN Setup', budget: '$4k - $6k', timeline: '6 Weeks', desc: 'IoT expert for soil moisture sensors.' },
  { title: 'Defect Detection CV Model', budget: '$6k - $10k', timeline: '2 Months', desc: 'Computer vision for assembly line.' },
  { title: 'Fitness Tracker Firmware', budget: '$4.5k - $7k', timeline: '5 Weeks', desc: 'nRF52 firmware development.' },
  { title: 'Autonomous Forklift SLAM', budget: '$8k - $12k', timeline: '3 Months', desc: 'ROS developer for warehouse robotics.' },
  { title: 'Custom PCB for Motor Control', budget: '$1k - $2k', timeline: '2 Weeks', desc: 'PCB layout for STM32 controller.' }
];

export const groups = [
  { name: 'Robotics Engineers Hub', desc: 'Discuss kinematics, ROS, and control systems.', members: '2.1k', skill: 92 },
  { name: 'Full Stack Dev Circle', desc: 'React, Node, Next.js, and cloud architecture.', members: '3.4k', skill: 88 },
  { name: 'IoT Innovators', desc: 'ESP32, LoRaWAN, MQTT, and edge computing.', members: '1.8k', skill: 85 },
  { name: 'AI/ML Researchers', desc: 'Deep learning, CV, NLP, and model deployment.', members: '4.2k', skill: 95 },
  { name: 'Mechanical Design Pros', desc: 'SolidWorks, Fusion 360, DFM, and 3D printing.', members: '2.5k', skill: 90 },
  { name: 'Embedded Systems Group', desc: 'Firmware, RTOS, microcontrollers, and PCB design.', members: '1.5k', skill: 87 },
  { name: 'Civil & Structural Eng', desc: 'AutoCAD, FEA, building codes, and materials.', members: '1.2k', skill: 82 },
  { name: 'Hardware Startups', desc: 'Prototyping, manufacturing, and supply chain.', members: '2.8k', skill: 89 }
];

export const supplierAds = [
  { name: 'MotionControl Supply', desc: 'High-Torque NEMA 23 Stepper Motors', category: 'Robotics' },
  { name: 'CircuitMakers', desc: 'Custom PCB Fabrication Service', category: 'Embedded' },
  { name: 'ConnectEdge', desc: 'Industrial IoT Gateway', category: 'IoT' },
  { name: 'MakersSupply Co.', desc: 'Industrial Grade 3D Printer - ProX 500', category: 'Manufacturing' },
  { name: 'SensorTech', desc: 'Precision Industrial Sensors', category: 'Hardware' },
  { name: 'AeroParts Direct', desc: 'Lightweight Carbon Fiber Components', category: 'Aerospace' }
];

export const chatMessagesData = [
  { text: 'Hey, are you available?', sender: 'user' as const },
  { text: 'Yes, share your requirement', sender: 'other' as const },
  { text: 'I need an ESP32 expert for a smart lock project.', sender: 'user' as const },
  { text: 'Sounds interesting. What protocols are you using?', sender: 'other' as const },
  { text: 'Mostly BLE and MQTT for the backend.', sender: 'user' as const }
];

export const products = [
  {
    id: 1, name: 'ESP32 Development Board', category: 'IoT Modules', price: 12.99, rating: 4.8,
    supplier: 'ElectroMakers', location: 'San Jose, CA',
    description: 'Powerful Wi-Fi + Bluetooth dual-core microcontroller for IoT projects.',
    image: 'https://picsum.photos/seed/prod1/400/300', badge: 'Top Seller',
    specs: ['Dual-core 240MHz', 'Wi-Fi & Bluetooth', '34 GPIOs'],
    reviews: [{ user: 'Alex', text: 'Great board for the price.', rating: 5 }]
  },
  {
    id: 2, name: 'Arduino Uno R3 Kit', category: 'Electronics', price: 35.00, rating: 4.6,
    supplier: 'TechSupply', location: 'Austin, TX',
    description: 'Complete starter kit with Arduino Uno R3, breadboard, LEDs, and sensors.',
    image: 'https://picsum.photos/seed/prod2/400/300', badge: 'Best Price',
    specs: ['ATmega328P', '14 Digital I/O Pins', '6 Analog Inputs'],
    reviews: [{ user: 'Sam', text: 'Perfect for beginners.', rating: 4 }]
  },
  {
    id: 3, name: 'Ultrasonic Sensor HC-SR04', category: 'Sensors', price: 3.50, rating: 4.5,
    supplier: 'SensorTech', location: 'Seattle, WA',
    description: 'Accurate distance measuring sensor for robotics and automation.',
    image: 'https://picsum.photos/seed/prod3/400/300', badge: '',
    specs: ['2cm to 400cm range', '5V DC', '15mA working current'],
    reviews: [{ user: 'John', text: 'Works as expected.', rating: 5 }]
  },
  {
    id: 4, name: 'CNC Aluminum Plate 5mm', category: 'Mechanical Parts', price: 25.00, rating: 4.7,
    supplier: 'MetalWorks', location: 'Detroit, MI',
    description: 'High-quality 6061 aluminum plate for custom CNC machining.',
    image: 'https://picsum.photos/seed/prod4/400/300', badge: '',
    specs: ['6061-T6 Aluminum', '5mm thickness', '300x300mm'],
    reviews: [{ user: 'Mike', text: 'Very flat and clean cuts.', rating: 5 }]
  },
  {
    id: 5, name: 'Raspberry Pi 5 (8GB)', category: 'Electronics', price: 85.00, rating: 4.9,
    supplier: 'PiStore', location: 'New York, NY',
    description: 'Latest generation single-board computer with 8GB RAM and PCIe support.',
    image: 'https://picsum.photos/seed/prod5/400/300', badge: 'Top Seller',
    specs: ['Broadcom BCM2712', '8GB LPDDR4X', 'PCIe 2.0 x1'],
    reviews: [{ user: 'Sarah', text: 'Incredibly fast compared to Pi 4.', rating: 5 }]
  },
  {
    id: 6, name: 'L298N Motor Driver Module', category: 'IoT Modules', price: 6.99, rating: 4.4,
    supplier: 'RoboParts', location: 'Boston, MA',
    description: 'Dual H-Bridge motor driver for controlling DC and stepper motors.',
    image: 'https://picsum.photos/seed/prod6/400/300', badge: '',
    specs: ['Up to 2A per channel', '5V-35V input', 'Thermal protection'],
    reviews: [{ user: 'David', text: 'Good for small robots.', rating: 4 }]
  },
  {
    id: 7, name: 'Custom 3D Printed Gears', category: 'Mechanical Parts', price: 15.00, rating: 4.6,
    supplier: 'PrintPro', location: 'Chicago, IL',
    description: 'Set of 5 custom 3D printed PETG gears for high-torque applications.',
    image: 'https://picsum.photos/seed/prod7/400/300', badge: '',
    specs: ['PETG material', 'Module 1.0', '100% infill'],
    reviews: [{ user: 'Chris', text: 'Durable and precise.', rating: 4 }]
  },
  {
    id: 8, name: 'Lithium Battery Pack 12V', category: 'Electronics', price: 45.00, rating: 4.8,
    supplier: 'PowerCell', location: 'Denver, CO',
    description: 'Rechargeable 12V 6000mAh Li-ion battery pack with BMS.',
    image: 'https://picsum.photos/seed/prod8/400/300', badge: 'Best Price',
    specs: ['12V Nominal', '6000mAh capacity', 'Built-in BMS'],
    reviews: [{ user: 'Tom', text: 'Holds charge very well.', rating: 5 }]
  },
  {
    id: 9, name: 'MPU6050 Gyro/Accel', category: 'Sensors', price: 5.50, rating: 4.5,
    supplier: 'SensorTech', location: 'Seattle, WA',
    description: '6-axis motion tracking device for drones and balancing robots.',
    image: 'https://picsum.photos/seed/prod9/400/300', badge: '',
    specs: ['3-axis Gyro', '3-axis Accelerometer', 'I2C interface'],
    reviews: [{ user: 'Anna', text: 'Essential for my drone build.', rating: 5 }]
  },
  {
    id: 10, name: 'NEMA 17 Stepper Motor', category: 'Mechanical Parts', price: 18.50, rating: 4.7,
    supplier: 'MotionControl Supply', location: 'Houston, TX',
    description: 'High-torque NEMA 17 stepper motor for 3D printers and CNCs.',
    image: 'https://picsum.photos/seed/prod10/400/300', badge: 'Top Seller',
    specs: ['1.8 degree step', '2.0A current', '59Ncm holding torque'],
    reviews: [{ user: 'Ben', text: 'Very strong and reliable.', rating: 5 }]
  },
  {
    id: 11, name: 'Soldering Iron Station', category: 'Tools', price: 65.00, rating: 4.8,
    supplier: 'ToolMasters', location: 'Portland, OR',
    description: 'Adjustable temperature soldering station with digital display.',
    image: 'https://picsum.photos/seed/prod11/400/300', badge: '',
    specs: ['200-480°C range', '60W power', 'ESD safe'],
    reviews: [{ user: 'Luke', text: 'Heats up fast.', rating: 5 }]
  },
  {
    id: 12, name: 'Digital Multimeter', category: 'Tools', price: 28.99, rating: 4.6,
    supplier: 'ElectroMakers', location: 'San Jose, CA',
    description: 'Auto-ranging digital multimeter for voltage, current, and resistance.',
    image: 'https://picsum.photos/seed/prod12/400/300', badge: 'Best Price',
    specs: ['Auto-ranging', 'True RMS', 'Backlit LCD'],
    reviews: [{ user: 'Mark', text: 'Accurate readings.', rating: 4 }]
  },
  {
    id: 13, name: 'LoRaWAN Gateway', category: 'IoT Modules', price: 150.00, rating: 4.9,
    supplier: 'ConnectEdge', location: 'Atlanta, GA',
    description: 'Indoor 8-channel LoRaWAN gateway for smart city applications.',
    image: 'https://picsum.photos/seed/prod13/400/300', badge: '',
    specs: ['8 channels', 'Wi-Fi/Ethernet backhaul', 'SX1302 chip'],
    reviews: [{ user: 'Evan', text: 'Great range and easy setup.', rating: 5 }]
  },
  {
    id: 14, name: 'Soil Moisture Sensor', category: 'Sensors', price: 4.20, rating: 4.3,
    supplier: 'AgriTech', location: 'Fresno, CA',
    description: 'Capacitive soil moisture sensor for smart agriculture.',
    image: 'https://picsum.photos/seed/prod14/400/300', badge: '',
    specs: ['Capacitive sensing', 'Corrosion resistant', 'Analog output'],
    reviews: [{ user: 'Lisa', text: 'Much better than resistive ones.', rating: 4 }]
  },
  {
    id: 15, name: 'Linear Rail MGN12', category: 'Mechanical Parts', price: 32.00, rating: 4.7,
    supplier: 'MetalWorks', location: 'Detroit, MI',
    description: '400mm MGN12 linear rail with carriage block for precision movement.',
    image: 'https://picsum.photos/seed/prod15/400/300', badge: '',
    specs: ['400mm length', 'MGN12H block', 'Stainless steel'],
    reviews: [{ user: 'Paul', text: 'Smooth sliding action.', rating: 5 }]
  },
  {
    id: 16, name: 'OLED Display 0.96"', category: 'Electronics', price: 8.50, rating: 4.6,
    supplier: 'TechSupply', location: 'Austin, TX',
    description: '128x64 pixel I2C OLED display module for microcontrollers.',
    image: 'https://picsum.photos/seed/prod16/400/300', badge: '',
    specs: ['128x64 resolution', 'I2C interface', 'SSD1306 driver'],
    reviews: [{ user: 'Emma', text: 'Crisp and bright.', rating: 5 }]
  },
  {
    id: 17, name: 'Wire Stripper Tool', category: 'Tools', price: 14.99, rating: 4.8,
    supplier: 'ToolMasters', location: 'Portland, OR',
    description: 'Automatic wire stripper and cutter for 10-24 AWG wires.',
    image: 'https://picsum.photos/seed/prod17/400/300', badge: 'Top Seller',
    specs: ['10-24 AWG', 'Self-adjusting', 'Crimping feature'],
    reviews: [{ user: 'Ryan', text: 'Saves so much time.', rating: 5 }]
  },
  {
    id: 18, name: 'BME280 Env Sensor', category: 'Sensors', price: 11.00, rating: 4.9,
    supplier: 'SensorTech', location: 'Seattle, WA',
    description: 'Precision temperature, humidity, and pressure sensor.',
    image: 'https://picsum.photos/seed/prod18/400/300', badge: '',
    specs: ['Temp, Humidity, Pressure', 'I2C/SPI', 'High precision'],
    reviews: [{ user: 'Kate', text: 'Very accurate readings.', rating: 5 }]
  },
  {
    id: 19, name: 'Relay Module 4-Channel', category: 'IoT Modules', price: 7.50, rating: 4.5,
    supplier: 'RoboParts', location: 'Boston, MA',
    description: '4-channel 5V relay module with optocoupler isolation.',
    image: 'https://picsum.photos/seed/prod19/400/300', badge: '',
    specs: ['4 channels', '10A 250VAC', 'Optoisolated'],
    reviews: [{ user: 'Dan', text: 'Works perfectly with Arduino.', rating: 4 }]
  },
  {
    id: 20, name: 'Carbon Fiber Tube', category: 'Mechanical Parts', price: 22.00, rating: 4.7,
    supplier: 'AeroParts Direct', location: 'Miami, FL',
    description: 'Lightweight and rigid 3K carbon fiber tube for drones.',
    image: 'https://picsum.photos/seed/prod20/400/300', badge: '',
    specs: ['16mm OD', '14mm ID', '500mm length'],
    reviews: [{ user: 'Leo', text: 'Very strong and light.', rating: 5 }]
  }
];
