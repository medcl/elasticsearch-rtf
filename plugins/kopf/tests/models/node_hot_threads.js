test("PRE 4859ce5d79a786b58b1cd2fb131614677efd6b91 format", function() {
  var response =
      '::: [Shathra][cb6GPV-zThGMq8D6CRxIag][nb-lmenezes.local][inet[/192.168.2.39:9300]]\n' +
  '   \n' +
  '    0.1% (415micros out of 500ms) cpu usage by thread \'elasticsearch[Shathra][scheduler][T#1]\'\n' +
  '     10/10 snapshots sharing following 9 elements\n' +
  '       sun.misc.Unsafe.park(Native Method)\n' +
  '       java.util.concurrent.locks.LockSupport.parkNanos(LockSupport.java:215)\n' +
  '       java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(AbstractQueuedSynchronizer.java:2078)\n' +
  '       java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:1093)\n' +
  '       java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:809)\n' +
  '       java.util.concurrent.ThreadPoolExecutor.getTask(ThreadPoolExecutor.java:1067)\n' +
  '       java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1127)\n' +
  '       java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)\n' +
  '       java.lang.Thread.run(Thread.java:745)\n' +
  '   \n' +
  '    0.1% (300micros out of 500ms) cpu usage by thread \'elasticsearch[Shathra][transport_client_timer][T#1]{Hashed wheel timer #1}\'\n' +
  '     10/10 snapshots sharing following 5 elements\n' +
  '       java.lang.Thread.sleep(Native Method)\n' +
  '       org.elasticsearch.common.netty.util.HashedWheelTimer$Worker.waitForNextTick(HashedWheelTimer.java:445)\n' +
  '       org.elasticsearch.common.netty.util.HashedWheelTimer$Worker.run(HashedWheelTimer.java:364)\n' +
  '       org.elasticsearch.common.netty.util.ThreadRenamingRunnable.run(ThreadRenamingRunnable.java:108)\n' +
  '       java.lang.Thread.run(Thread.java:745)\n' +
  '   \n' +
  '    0.0% (203micros out of 500ms) cpu usage by thread \'elasticsearch[Shathra][[timer]]\'\n' +
  '     10/10 snapshots sharing following 2 elements\n' +
  '       java.lang.Thread.sleep(Native Method)\n' +
  '       org.elasticsearch.threadpool.ThreadPool$EstimatedTimeThread.run(ThreadPool.java:567)\n' +
  '\n' +
  '::: [Andrew Gervais][vpYGR3e-QCi_sU5--zInuQ][nb-lmenezes.local][inet[/192.168.2.39:9301]]\n' +
  '   \n' +
  '    0.2% (1ms out of 500ms) cpu usage by thread \'elasticsearch[Andrew Gervais][[transport_server_worker.default]][T#13]{New I/O worker #30}\'\n' +
  '     10/10 snapshots sharing following 15 elements\n' +
  '       sun.nio.ch.KQueueArrayWrapper.kevent0(Native Method)\n' +
  '       sun.nio.ch.KQueueArrayWrapper.poll(KQueueArrayWrapper.java:198)\n' +
  '       sun.nio.ch.KQueueSelectorImpl.doSelect(KQueueSelectorImpl.java:103)\n' +
  '       sun.nio.ch.SelectorImpl.lockAndDoSelect(SelectorImpl.java:86)\n' +
  '       sun.nio.ch.SelectorImpl.select(SelectorImpl.java:97)\n' +
  '       org.elasticsearch.common.netty.channel.socket.nio.SelectorUtil.select(SelectorUtil.java:68)\n' +
  '       org.elasticsearch.common.netty.channel.socket.nio.AbstractNioSelector.select(AbstractNioSelector.java:415)\n' +
  '       org.elasticsearch.common.netty.channel.socket.nio.AbstractNioSelector.run(AbstractNioSelector.java:212)\n' +
  '       org.elasticsearch.common.netty.channel.socket.nio.AbstractNioWorker.run(AbstractNioWorker.java:89)\n' +
  '       org.elasticsearch.common.netty.channel.socket.nio.NioWorker.run(NioWorker.java:178)\n' +
  '       org.elasticsearch.common.netty.util.ThreadRenamingRunnable.run(ThreadRenamingRunnable.java:108)\n' +
  '       org.elasticsearch.common.netty.util.internal.DeadLockProofWorker$1.run(DeadLockProofWorker.java:42)\n' +
  '       java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)\n' +
  '       java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)\n' +
  '       java.lang.Thread.run(Thread.java:745)\n' +
  '   \n' +
  '    0.1% (329micros out of 500ms) cpu usage by thread \'elasticsearch[Andrew Gervais][transport_client_timer][T#1]{Hashed wheel timer #1}\'\n' +
  '     10/10 snapshots sharing following 5 elements\n' +
  '       java.lang.Thread.sleep(Native Method)\n' +
  '       org.elasticsearch.common.netty.util.HashedWheelTimer$Worker.waitForNextTick(HashedWheelTimer.java:445)\n' +
  '       org.elasticsearch.common.netty.util.HashedWheelTimer$Worker.run(HashedWheelTimer.java:364)\n' +
  '       org.elasticsearch.common.netty.util.ThreadRenamingRunnable.run(ThreadRenamingRunnable.java:108)\n' +
  '       java.lang.Thread.run(Thread.java:745)\n' +
  '   \n' +
  '    0.0% (199micros out of 500ms) cpu usage by thread \'elasticsearch[Andrew Gervais][[timer]]\'\n' +
  '     10/10 snapshots sharing following 2 elements\n' +
  '       java.lang.Thread.sleep(Native Method)\n' +
  '       org.elasticsearch.threadpool.ThreadPool$EstimatedTimeThread.run(ThreadPool.java:567)';
  var hot_threads = new HotThreads(response);
  equal(hot_threads.nodes_hot_threads.length, 2, "Should parse threads from all nodes");
  equal(hot_threads.nodes_hot_threads[0].header, ' [Shathra][cb6GPV-zThGMq8D6CRxIag][nb-lmenezes.local][inet[/192.168.2.39:9300]]', "Should parse correctly the node header");
  equal(hot_threads.nodes_hot_threads[0].subHeader, undefined, "Should parse correctly the node sub header");
  equal(hot_threads.nodes_hot_threads[0].threads.length, 4, "Should parse correctly the node threads");
  equal(hot_threads.nodes_hot_threads[0].threads[0].header, '    0.1% (415micros out of 500ms) cpu usage by thread \'elasticsearch[Shathra][scheduler][T#1]\'', "Should parse correctly the thread header");
  equal(hot_threads.nodes_hot_threads[0].threads[0].subHeader, '     10/10 snapshots sharing following 9 elements', "Should parse correctly the thread sub header");
  var stack = [
          "       sun.misc.Unsafe.park(Native Method)",
          "       java.util.concurrent.locks.LockSupport.parkNanos(LockSupport.java:215)",
          "       java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(AbstractQueuedSynchronizer.java:2078)",
          "       java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:1093)",
          "       java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:809)",
          "       java.util.concurrent.ThreadPoolExecutor.getTask(ThreadPoolExecutor.java:1067)",
          "       java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1127)",
          "       java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)",
          "       java.lang.Thread.run(Thread.java:745)",
          "   "
  ];
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[0], stack[0], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[1], stack[1], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[2], stack[2], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[3], stack[3], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[4], stack[4], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[5], stack[5], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[6], stack[6], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[7], stack[7], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[8], stack[8], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[9], stack[9], "Should parse correctly the thread stack");
})

test("POST 4859ce5d79a786b58b1cd2fb131614677efd6b91 format", function() {
  var response =
      '::: [Shathra][cb6GPV-zThGMq8D6CRxIag][nb-lmenezes.local][inet[/192.168.2.39:9300]]\n' +
      '   Hot threads at 2015-05-13T19:11:07.010Z, interval=500ms, busiestThreads=3, ignoreIdleThreads=true:\n' +
      '   \n' +
      '    0.1% (415micros out of 500ms) cpu usage by thread \'elasticsearch[Shathra][scheduler][T#1]\'\n' +
      '     10/10 snapshots sharing following 9 elements\n' +
      '       sun.misc.Unsafe.park(Native Method)\n' +
      '       java.util.concurrent.locks.LockSupport.parkNanos(LockSupport.java:215)\n' +
      '       java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(AbstractQueuedSynchronizer.java:2078)\n' +
      '       java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:1093)\n' +
      '       java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:809)\n' +
      '       java.util.concurrent.ThreadPoolExecutor.getTask(ThreadPoolExecutor.java:1067)\n' +
      '       java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1127)\n' +
      '       java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)\n' +
      '       java.lang.Thread.run(Thread.java:745)\n' +
      '   \n' +
      '    0.1% (300micros out of 500ms) cpu usage by thread \'elasticsearch[Shathra][transport_client_timer][T#1]{Hashed wheel timer #1}\'\n' +
      '     10/10 snapshots sharing following 5 elements\n' +
      '       java.lang.Thread.sleep(Native Method)\n' +
      '       org.elasticsearch.common.netty.util.HashedWheelTimer$Worker.waitForNextTick(HashedWheelTimer.java:445)\n' +
      '       org.elasticsearch.common.netty.util.HashedWheelTimer$Worker.run(HashedWheelTimer.java:364)\n' +
      '       org.elasticsearch.common.netty.util.ThreadRenamingRunnable.run(ThreadRenamingRunnable.java:108)\n' +
      '       java.lang.Thread.run(Thread.java:745)\n' +
      '   \n' +
      '    0.0% (203micros out of 500ms) cpu usage by thread \'elasticsearch[Shathra][[timer]]\'\n' +
      '     10/10 snapshots sharing following 2 elements\n' +
      '       java.lang.Thread.sleep(Native Method)\n' +
      '       org.elasticsearch.threadpool.ThreadPool$EstimatedTimeThread.run(ThreadPool.java:567)\n' +
      '\n' +
      '::: [Andrew Gervais][vpYGR3e-QCi_sU5--zInuQ][nb-lmenezes.local][inet[/192.168.2.39:9301]]\n' +
      '   Hot threads at 2015-05-13T19:11:07.010Z, interval=500ms, busiestThreads=3, ignoreIdleThreads=true:\n' +
      '   \n' +
      '    0.2% (1ms out of 500ms) cpu usage by thread \'elasticsearch[Andrew Gervais][[transport_server_worker.default]][T#13]{New I/O worker #30}\'\n' +
      '     10/10 snapshots sharing following 15 elements\n' +
      '       sun.nio.ch.KQueueArrayWrapper.kevent0(Native Method)\n' +
      '       sun.nio.ch.KQueueArrayWrapper.poll(KQueueArrayWrapper.java:198)\n' +
      '       sun.nio.ch.KQueueSelectorImpl.doSelect(KQueueSelectorImpl.java:103)\n' +
      '       sun.nio.ch.SelectorImpl.lockAndDoSelect(SelectorImpl.java:86)\n' +
      '       sun.nio.ch.SelectorImpl.select(SelectorImpl.java:97)\n' +
      '       org.elasticsearch.common.netty.channel.socket.nio.SelectorUtil.select(SelectorUtil.java:68)\n' +
      '       org.elasticsearch.common.netty.channel.socket.nio.AbstractNioSelector.select(AbstractNioSelector.java:415)\n' +
      '       org.elasticsearch.common.netty.channel.socket.nio.AbstractNioSelector.run(AbstractNioSelector.java:212)\n' +
      '       org.elasticsearch.common.netty.channel.socket.nio.AbstractNioWorker.run(AbstractNioWorker.java:89)\n' +
      '       org.elasticsearch.common.netty.channel.socket.nio.NioWorker.run(NioWorker.java:178)\n' +
      '       org.elasticsearch.common.netty.util.ThreadRenamingRunnable.run(ThreadRenamingRunnable.java:108)\n' +
      '       org.elasticsearch.common.netty.util.internal.DeadLockProofWorker$1.run(DeadLockProofWorker.java:42)\n' +
      '       java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)\n' +
      '       java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)\n' +
      '       java.lang.Thread.run(Thread.java:745)\n' +
      '   \n' +
      '    0.1% (329micros out of 500ms) cpu usage by thread \'elasticsearch[Andrew Gervais][transport_client_timer][T#1]{Hashed wheel timer #1}\'\n' +
      '     10/10 snapshots sharing following 5 elements\n' +
      '       java.lang.Thread.sleep(Native Method)\n' +
      '       org.elasticsearch.common.netty.util.HashedWheelTimer$Worker.waitForNextTick(HashedWheelTimer.java:445)\n' +
      '       org.elasticsearch.common.netty.util.HashedWheelTimer$Worker.run(HashedWheelTimer.java:364)\n' +
      '       org.elasticsearch.common.netty.util.ThreadRenamingRunnable.run(ThreadRenamingRunnable.java:108)\n' +
      '       java.lang.Thread.run(Thread.java:745)\n' +
      '   \n' +
      '    0.0% (199micros out of 500ms) cpu usage by thread \'elasticsearch[Andrew Gervais][[timer]]\'\n' +
      '     10/10 snapshots sharing following 2 elements\n' +
      '       java.lang.Thread.sleep(Native Method)\n' +
      '       org.elasticsearch.threadpool.ThreadPool$EstimatedTimeThread.run(ThreadPool.java:567)';
  var hot_threads = new HotThreads(response);
  equal(hot_threads.nodes_hot_threads.length, 2, "Should parse threads from all nodes");
  equal(hot_threads.nodes_hot_threads[0].header, ' [Shathra][cb6GPV-zThGMq8D6CRxIag][nb-lmenezes.local][inet[/192.168.2.39:9300]]', "Should parse correctly the node header");
  equal(hot_threads.nodes_hot_threads[0].subHeader, '   Hot threads at 2015-05-13T19:11:07.010Z, interval=500ms, busiestThreads=3, ignoreIdleThreads=true:', "Should parse correctly the node sub header");
  equal(hot_threads.nodes_hot_threads[0].threads.length, 4, "Should parse correctly the node threads");
  equal(hot_threads.nodes_hot_threads[0].threads[0].header, '    0.1% (415micros out of 500ms) cpu usage by thread \'elasticsearch[Shathra][scheduler][T#1]\'', "Should parse correctly the thread header");
  equal(hot_threads.nodes_hot_threads[0].threads[0].subHeader, '     10/10 snapshots sharing following 9 elements', "Should parse correctly the thread sub header");
  var stack = [
    "       sun.misc.Unsafe.park(Native Method)",
    "       java.util.concurrent.locks.LockSupport.parkNanos(LockSupport.java:215)",
    "       java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(AbstractQueuedSynchronizer.java:2078)",
    "       java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:1093)",
    "       java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:809)",
    "       java.util.concurrent.ThreadPoolExecutor.getTask(ThreadPoolExecutor.java:1067)",
    "       java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1127)",
    "       java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)",
    "       java.lang.Thread.run(Thread.java:745)",
    "   "
  ];
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[0], stack[0], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[1], stack[1], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[2], stack[2], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[3], stack[3], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[4], stack[4], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[5], stack[5], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[6], stack[6], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[7], stack[7], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[8], stack[8], "Should parse correctly the thread stack");
  equal(hot_threads.nodes_hot_threads[0].threads[0].stack[9], stack[9], "Should parse correctly the thread stack");
})