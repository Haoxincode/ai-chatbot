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
        <h1 className="text-2xl font-bold">深度思考对话器</h1>
        <p>
          欢迎来到深度思考的世界！这里是一个让你放飞思维、探索内心的地方。
          通过与这个对话器交流，你可以学会如何进行更深层次的思考。
        </p>
        <p>
          以下是一些帮助你开始深度思考的建议：
        </p>
        <ul className="list-disc text-left pl-6">
          <li>提出&ldquo;为什么&rdquo;的问题，探索事物的本质</li>
          <li>尝试从不同角度看待问题</li>
          <li>思考事物之间的联系</li>
          <li>质疑你的假设，挑战自己的观点</li>
          <li>反思你的经历，寻找其中的意义</li>
        </ul>
        <p>
          准备好了吗？开始一场深度思考的旅程吧！
        </p>
      </div>
    </motion.div>
  );
};

