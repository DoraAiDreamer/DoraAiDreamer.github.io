---
title: "zookeeper-分布式应用协调服务"
subtitle: "zookeeper-分布式应用协调服务"
date: 2019-09-09
author: "DoraAiDreamer"
category: "大数据"
tags:
  - "大数据"
---

### Zookeeper是什么？
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;引用官方的说法：“Zookeeper是一个高性能，分布式的，开源分布式应用协调服务。它提供了简单原始的功能，分布式应用可以基于它实现更高级 的服务，比如同步，配置管理，集群管理，名空间。它被设计为易于编程，使用文件系统目录树作为数据模型。服务端跑在java上，提供java和C的客户端 API”。
### Zookeeper总体结构
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Zookeeper服务自身组成一个集群(2n+1个服务允许n个失效)。Zookeeper服务有两个角色，一个是leader，负责写服务和数据同步，剩下的是follower，提供读服务，leader失效后会在follower中重新选举新的leader。

Zookeeper逻辑图如下，
![Zookeeper逻辑图.jpg](/img/Zookeeper逻辑图.jpg "Zookeeper逻辑图.jpg")

1.客户端可以连接到每个server，每个server的数据完全相同。
2.每个follower都和leader有连接，接受leader的数据更新操作。
3.Server记录事务日志和快照到持久存储。
4.大多数server可用，整体服务就可用。


### Zookeeper数据模型
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Zookeeper表现为一个分层的文件系统目录树结构（不同于文件系统的是，节点可以有自己的数据，而文件系统中的目录节点只有子节点）。
数据模型结构图如下，
![数据模型结构图.png](/img/zookeeper数据模型结构.png "数据模型结构图.png")



