import { motion } from 'framer-motion';

import { MessageIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <MessageIcon size={32} />
        </p>
        <p>
          欢迎使用 Nebula Tech Design，这是一个革命性的AI驱动汽车开发工具链。我们的平台集成了
          <span className="font-medium">时序图生成</span>、
          <span className="font-medium">服务接口定义</span>和
          <span className="font-medium">代码实现</span>等关键功能，
          旨在加速EEA（电子电气架构）设计的迭代过程。
        </p>
        <p>
          通过与AI对话，您可以轻松创建复杂的系统交互图，生成清晰的服务接口，
          并获取符合最佳实践的代码实现。我们的工具链旨在提高开发效率，激发创新，
          并推动智能汽车技术的进步。
        </p>
        <p>
          开始您的AI辅助汽车开发之旅，体验未来汽车工程的智能化革命。如果您有任何问题或需要帮助，
          请随时与我们的AI助手交流。
        </p>
      </div>
    </motion.div>
  );
};