---
title: "Hadoop之HDFS"
subtitle: "Hadoop之HDFS"
date: 2019-09-09
author: "DoraAiDreamer"
category: "大数据"
tags:
  - "大数据"
  - "HDFS"
---

### 一、介绍
HDFS(The Hadoop Distributed File System)，是被设计成适合运行在通用硬件(commodity hardware)上的 Hadoop 的分布式文件系统。它与其他的分布式系统有非常显著的不同，首先 HDFS 具有高容错性，并且它可以被部署到廉价的硬件上。此外，HDFS 提供对应用程序数据的高吞吐量访问，适用于具有大型数据集的应用程序。  
目前，HDFS 作为 Apache Hadoop 的核心项目，URL为： [hadoop.apache.org/]()

### 二、HDFS 优点
#### 2.1 硬件故障防治  
一个 HDFS 实例有可能包含数百台或数千台服务器，每一个台机器都存储文件系统数据的一部分，这种情况下硬件故障是常态。而 HDFS 可检测故障并从中快速自动恢复。
#### 2.2 流数据访问
HDFS 设计用于批处理而不是用户的交互式使用，其重点是数据访问的高吞吐量而并不追求数据访问的低延迟。
#### 2.3 处理大数据集
HDFS 的核心目标就是为处理具有大数据量的应用，在其上运行的应用的文件大小一般都为 TB 级别。HDFS 可提供高聚合数据带宽并且要扩展到集群中的数百个节点上，并对于单个应用可支持上千万个文件。
#### 2.4 简单一致模型
HDFS 应用程序是一个"一次写入多次读取"的文件访问模型。这种模型可以简化数据的一致性问题并且能够实现高吞吐数据访问。官方文档表示有计划支持追加写入文件的功能。

#### 2.5 移动计算替代移动数据
“Moving Computation is Cheaper than Moving Data”，当一个计算程序与数据同在一个物理节点上时，运算最高效，特别是当数据量特别大时，移动计算远优于移动数据集。移动计算可以最大限度地减少网络拥塞并提高系统的整体吞吐量。HDFS 设计的是将计算迁移到更靠近数据所在的位置，而不是将数据移动到运行应用程序的位置。HDFS 为应用程序提供了接口，使其自身更靠近数据。

#### 2.6 跨异构硬件和软件平台的可移植性

HDFS 的设计便于从一个平台移植到另一个平台。 这有助于广泛采用 HDFS 作为大量应用程序的首选大数据处理平台。

### 三、NameNode & DataNodes
NameNode 与 DataNode 是 HDFS 系统的重要知识点。HDFS 是 master/slave 体系结构。一个 HDFS 集群是由单个 NameNode 和众多 DataNode 组成，文件会被分成一个或多个块，这些块存储在一组 DataNode 中。
因为 HDFS 是用 Java 语言搭建的，所以只要是支持 Java 语言的机器都可以运行 NameNode 和 DataNode。并且因为 Java 的高可移植性，HDFS 也具有非常广泛的应用范围。一种典型的 HDFS 部署模式是指定一个物理主机运行 NameNode，然后其余的机器运行 DataNode，在实际部署情况中，一般都是一台主机部署一个 DataNode。
群集中存在单个 NameNode 极大地简化了系统的体系结构。 NameNode 是所有 HDFS 元数据的决定者和存储库。系统的这种设计使用户数据永远不会流经 NameNode，可理解 NameNode 为整个系统的中枢。  
架构如下图：

![](/img/HDFS-1-1.png)

首先图中的 rack 翻译为“机架”，可以理解为两个处于不同地方的机群，每个机群内部有自己的连接方式。其次在 DataNode 中存储的不是当个文件，而是文件块（Block），在 HDFS 中，每个大文件会拆分成多个 Block，然后将这些 Block 散布存储在不同的 DataNode 中，并且每个 Block 会有多个复制，也会存储到其他的 DataNode中。

可以看出上图分别解释了“读”和“写”两种操作：

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1，当有客户端要向 HDFS 写入文件时，图中将文件拆分的 Block 写入到了两个机架的 DataNode 中，一般情况下就是两个机架的两个物理主机中，可以看出文件数据没有经过 NameNode。数据写入的过程见（“七、数据复制流水线”）  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2，当有客户端要从 HDFS 读取文件时，会将操作命令传向 NameNode，然后 NameNode 转为对应的数据块的操作，指挥相应的 DataNode 将所需数据返回给客户端。


**注意：** 还有一个节点图中没有显示，叫作 Secondary Namenode，是辅助后台程序，主要负责与 NameNode 进行通信，定期保存 HDFS 元数据的快照及备份其他 NameNode 中的内容，日常 Standby，当 NameNode 故障时顶替 NameNode 使用。
#### NameNode

NameNode 是管理文件系统命名空间的主服务器，用于管理客户端对文件的访问，执行文件系统命名空间操作，如打开，关闭和重命名文件和目录。它还确定了Block 到 DataNode 的映射。
NameNode 做着有关块复制的所有决定，它定期从群集中的每个 DataNode 接收 Heartbeat 和 Blockreport。收到 Heartbeat 意味着 DataNode正常运行，Blockreport 包含 DataNode 上所有块的列表。
#### DataNode
DataNode 通常是群集中每个节点一个，用于存储数据，负责提供来自文件系统客户端的读写请求。并且还会根据 NameNode 的指令执行块创建，删除和复制。
### 四、HDFS文件系统命名空间及元数据
HDFS 支持传统的分层文件组织，文件系统命名空间层次结构与大多数其他现有文件系统类似，一个用户或者应用可以创建文件夹并且在这个文件夹里存储文件。但是 HDFS 不支持 Linux 里的硬链接和软连接。NameNode 维护着文件系统的命名空间，其记录对文件系统命名空间或其属性的任何更改，NameNode 还会存储复制因子。

    数据块的副本数称为该数据块的复制因子

文件系统的元数据（MetaData）也存储在 NameNode 中，NameNode 使用名为 EditLog 的事务日志来持久记录文件系统元数据发生的每个更改。例如，在 HDFS 中创建新文件会导致 NameNode 将记录插入 EditLog，以指示此情况。NameNode 使用其本地主机OS文件系统中的文件来存储 EditLog。
而整个文件系统命名空间（包括块到文件和文件系统属性的映射）存储在名为 FsImage 的文件中。 FsImage 也作为文件存储在 NameNode 的本地文件系统中。

#### 元数据的持久化
NameNode 在整个内存中保存整个文件系统命名空间和文件的数据块映射。当 NameNode 启动，或者检查点由可配置的阈值触发时，它从磁盘读取 FsImage 和 EditLog，并先将 FsImage 中的文件系统元数据信息加载到内存，然后把 EditLog 中的所有事务应用到内存中的 FsImage，最后将此新版本同步到磁盘上的 FsImage。然后它可以截断旧的 EditLog，因为它的事务已应用于持久性 FsImage。此过程称为检查点。
检查点的目的是通过获取文件系统元数据的快照并将其保存到 FsImage 来确保 HDFS 具有文件系统元数据的一致视图。尽管直接从内存中读取 FsImage 很高效，但直接对 FsImage 进行增量编辑效率不高。我们不会修改每个编辑的 FsImage，而是在 Editlog 中保留编辑内容。
在检查点期间，Editlog 的更改将应用于 FsImage。可以以秒为单位的给定时间间隔（dfs.namenode.checkpoint.period）触发检查点，或者在累积给定数量的文件系统事务（dfs.namenode.checkpoint.txns）之后触发检查点。如果同时设置了这两个属性，则一旦满足其中一个阈值就可触发检查点。

### 五、数据复制（Data Replication）
HDFS 旨在跨大型集群中的计算机可靠地存储非常大的文件。它将每个文件存储为一系列块，除最后一个块之外的文件中的所有块都具有相同的大小，HDFS 使用的默认块大小为 128MB。复制文件的块以实现容错，且一般复制出的文件块会存储到不同的 DataNode 中。数据块的大小以及复制因子都是可以由用户设置。

HDFS中的文件是一次写入的，并且在任何时候都只能有一个写入器。

![](/img/HDFS1-2.png)

解释：如图所示，part-0 文件复制因子为r:2，其拆分的数据块号有{1,3}，所以 1 号数据块在第1，第3个 DataNode 上，3 号数据块在第5，第6个DataNode上；part-1文件解释同理。而这些信息都存储在 NameNode 中。

HDFS 副本存放策略
刚刚只是简单的介绍了图里的信息，实际 HDFS 副本放置策略是一个值得研究的课题，因为这切实关系到 HDFS 的可依赖性与表现，并且经过优化的副本放置策略也使得 HDFS 相比其他分布式文件系统具有优势。
在大部分的实际案例中，当复制因子是 r = 3 时，HDFS 的放置策略是将一个复制品放置到写入器操作的 DataNode中，第二个复制品放置到另一个远程机架上的一个节点中，然后最后一个复制品则放置同一个远程机架的不同物理节点中。

这种放置策略可以有效的减少机架之中的通信以提高系统的表现。因为不同机架的物理节点的通信需要通过交换机，而在大多数情况下，同一机架中的计算机之间的网络带宽大于不同机架中的计算机之间的网络带宽。

如果复制因子大于3，则随机确定第4个及以后副本的放置，同时保持每个机架的副本数量低于上限。

上限数一般为（副本数-1）/ 机架 + 2

由于 NameNode 不允许 DataNode 具有同一块的多个副本，因此，能创建的最大副本数是此时 DataNode 的总数。
当有客户端请求读取时，HDFS 为了最小化全局带宽消耗与读取延迟，会优先选择离读取客户端最近的数据副本。

### 六、通信协议
所有 HDFS 通信协议都分层在 TCP/IP 协议之上。

### 七、数据复制流水线
当客户端将数据写入复制因子为 r = 3 的 HDFS 文件时，NameNode 使用 replication target choosing algorithm 检索 DataNode 列表。此列表包含将承载该块副本的 DataNode。
然后客户端向第一个 DataNode 写入，第一个 DataNode 开始分批接收数据，将每个部分写入其本地存储，并将该部分传输到列表中的第二个 DataNode。第二个 DataNode 又开始接收数据块的每个部分，将该部分写入其存储，然后将该部分刷新到第三个 DataNode。最后，第三个 DataNode 将数据写入其本地存储。
可见，DataNode 是从流水线中的前一个接收数据，同时将数据转发到流水线中的下一个，数据是从一个 DataNode 流水线到下一个 DataNode。
### 八、可操作
应用可以以多种方式操控 HDFS 上的文件，其中通过 FS Shell 可以像操控 Linux 文件系统一般，常用命令有：

| Action  |	Command|
|---|---|
| 创建 foodir 文件夹  |bin/hadoop fs -mkdir /foodir|
| 删除文件夹  |bin/hadoop fs -rm -R /foodir|
| 查看文件内容  |bin/hdfs dfs -cat /foodir/myfile.txt|
| 上传文件  |bin/hdfs dfs -copyFromLocal ~/a.txt /foodir/|
| ……  |……|

**注：** 会发现这里有两种命令前缀，一个是 hadoop fs，一个是 hdfs dfs
区别是：hadoop fs 可以用于其他文件系统，不止是hdfs文件系统内，也就是说该命令的使用范围更广；而 hdfs dfs 专门针对hdfs分布式文件系统。
还有一个前缀为 hadoop dfs，这个已经过时，建议不要使用🙅。

### 九、空间回收
#### 9.1 文件删除和取消删除
如果启用了垃圾箱配置，则 FS Shell 删除的文件不会立即从 HDFS 中删除，而是 HDFS 将其移动到垃圾目录（/user/username/.Trash）。

在垃圾箱中，被删除文件的生命周期到期后，NameNode 将从 HDFS 命名空间中删除该文件。删除文件会导致释放与文件关联的块。


        注意：在用户删除文件的时间与 HDFS 中相应增加的可用空间之间可能存在明显的时间延迟。
        
如果启用了垃圾箱配置，想直接彻底删除，命令为：hadoop fs -rm -r -skipTrash a.txt
#### 9.2 减少复制因子
当文件的复制因子减少时，NameNode 选择可以删除的多余副本。下一个 Heartbeat 将此信息传输到 DataNode。然后，DataNode删除相应的块，并在群集中显示相应的可用空间。
       
### 参考   
[1] Hadoop [JavaDoc API](http://hadoop.apache.org/docs/current/api/)

[2] HDFS 源码: [hadoop.apache.org/version_con…](http://hadoop.apache.org/version_control.html)

[3] HDFS 文档： [hadoop.apache.org/docs/stable…](http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html)

     