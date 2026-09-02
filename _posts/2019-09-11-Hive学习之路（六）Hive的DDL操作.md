---
layout:     post
title:      Hive学习之路 （六）Hive的DDL操作
subtitle:   Hive的DDL操作
date:       2019-09-09
author:     DoraAiDreamer
category:   大数据
header-img: img/post-bg-map.jpeg
catalog: true
tags:
    - 大数据
    - Hive
---
### 一、库操作

#### 1、创建库

>CREATE (DATABASE|SCHEMA) [IF NOT EXISTS] database_name
>
>　　[COMMENT database_comment]　　　　　　//关于数据块的描述
>
>　　[LOCATION hdfs_path]　　　　　　　　　　//指定数据库在HDFS上的存储位置
>
>　　[WITH DBPROPERTIES (property_name=property_value, ...)];　　　　//指定数据块属性

　默认地址：/user/hive/warehouse/db_name.db/table_name/partition_name/…

##### （1）创建普通的数据库

>create database t1;

##### （2）创建库的时候检查存与否

>create database if not exists t1;

##### （3）创建库的时候带注释

>create database if not exists t2 comment 'learning hive';

##### （4）创建带属性的库

>create database if not exists t3 with dbproperties('creator'='hadoop','date'='2018-04-05');


#### 2、查看库

##### （1）查看有哪些数据库

>show databases;

##### （2）显示数据库的详细属性信息

>desc database [extended] dbname;

##### （3）查看正在使用哪个库

>select current_database();

##### （4）查看创建库的详细语句

>show create database t3;

#### 3、删除库

>drop database dbname;
>drop database if exists dbname;

默认情况下，hive 不允许删除包含表的数据库，有两种解决办法：

1、 手动删除库下所有表，然后删除库

2、 使用 cascade 关键字

drop database if exists dbname cascade;

>默认情况下就是 restrict drop database if exists myhive ==== drop database if exists myhive restrict

##### （1）删除不含表的数据库

>show tables in t1;  
> drop database t1;  
> show databases;  

##### （2）删除含有表的数据库

> drop database if exists t3 cascade;

##### 4、切换库

>use database_name

### 二 表操作

#### 1、创建表

>CREATE [EXTERNAL] TABLE [IF NOT EXISTS] table_name
>
>　　[(col_name data_type [COMMENT col_comment], ...)]
>
>　　[COMMENT table_comment]
>
>　　[PARTITIONED BY (col_name data_type [COMMENT col_comment], ...)]
>
>　　[CLUSTERED BY (col_name, col_name, ...)
>
>　　　　[SORTED BY (col_name [ASC|DESC], ...)] INTO num_buckets BUCKETS]
>
>　　[ROW FORMAT row_format]
>
>　　[STORED AS file_format]
>
>　　[LOCATION hdfs_path]


    •CREATE TABLE  创建一个指定名字的表。如果相同名字的表已经存在，则抛出异常；用户可以用 IF NOT EXIST 选项来忽略这个异常
    •EXTERNAL  关键字可以让用户创建一个外部表，在建表的同时指定一个指向实际数据的路径（LOCATION）
    •LIKE  允许用户复制现有的表结构，但是不复制数据
    •COMMENT 可以为表与字段增加描述
    •PARTITIONED BY 指定分区
    •ROW FORMAT 
    　　DELIMITED [FIELDS TERMINATED BY char] [COLLECTION ITEMS TERMINATED BY char] 
    　　　　MAP KEYS TERMINATED BY char] [LINES TERMINATED BY char] 
    　　　　| SERDE serde_name [WITH SERDEPROPERTIES 
    　　　　(property_name=property_value, property_name=property_value, ...)] 
    　　用户在建表的时候可以自定义 SerDe 或者使用自带的 SerDe。如果没有指定 ROW FORMAT 或者 ROW FORMAT DELIMITED，将会使用自带的 SerDe。在建表的时候，
    用户还需要为表指定列，用户在指定表的列的同时也会指定自定义的 SerDe，Hive 通过 SerDe 确定表的具体的列的数据。 
    •STORED AS 
    　　SEQUENCEFILE //序列化文件
    　　| TEXTFILE //普通的文本文件格式
    　　| RCFILE　　//行列存储相结合的文件
    　　| INPUTFORMAT input_format_classname OUTPUTFORMAT output_format_classname //自定义文件格式
    　　如果文件数据是纯文本，可以使用 STORED AS TEXTFILE。如果数据需要压缩，使用 STORED AS SEQUENCE 。
    •LOCATION指定表在HDFS的存储路径


最佳实践：  
　　如果一份数据已经存储在HDFS上，并且要被多个用户或者客户端使用，最好创建外部表  
　　反之，最好创建内部表。

　　如果不指定，就按照默认的规则存储在默认的仓库路径中。

##### （1）创建默认的内部表

>create table student(id int, name string, sex string, age int,department string) row format delimited fields terminated by ",";

##### （2）外部表

> create external table student_ext
(id int, name string, sex string, age int,department string) row format delimited fields terminated by "," location "/hive/student";

##### （3）分区表

>create external table student_ptn(id int, name string, sex string, age int,department string)  
> partitioned by (city string)  
> row format delimited fields terminated by ","
> location "/hive/student_ptn";

添加分区

> alter table student_ptn add partition(city="beijing");  
> alter table student_ptn add partition(city="shenzhen");

##### （4）分桶表

> create external table student_bck(id int, name string, sex string, age int,department string)  
> clustered by (id) sorted by (id asc, name desc) into 4 buckets  
> row format delimited fields terminated by ","  
> location "/hive/student_bck";


##### （5）使用CTAS创建表

作用： 就是从一个查询SQL的结果来创建一个表进行存储

现象student表中导入数据


> load data local inpath "/home/hadoop/student.txt" into table student;

使用CTAS创建表

> create table student_ctas as select * from student where id < 95012;


##### （6）复制表结构

> create table student_copy like student;

注意：

如果在table的前面没有加external关键字，那么复制出来的新表。无论如何都是内部表  
如果在table的前面有加external关键字，那么复制出来的新表。无论如何都是外部表

### 2、查看表

#### （1）查看表列表

#####  查看当前使用的数据库中有哪些表

> show tables;

##### 查看非当前使用的数据库中有哪些表

> show tables in myhive;

##### 查看数据库中以xxx开头的表

> show tables like 'student_c*';

#### （2）查看表的详细信息

##### 查看表的信息

> desc student;

##### 查看表的详细信息（格式不友好）

> desc extended student;

##### 查看表的详细信息（格式友好）

> desc formatted student;

##### 查看分区信息

> show partitions student_ptn;

#### （3）查看表的详细建表语句

> show create table student_ptn;

### 3、修改表

#### （1）修改表名

> alter table student rename to new_student;

#### （2）修改字段定义

A. 增加一个字段

> alter table new_student add columns (score int);

B. 修改一个字段的定义

> alter table new_student change name new_name string;

C. 删除一个字段

不支持

D. 替换所有字段

> alter table new_student replace columns (id int, name string, address string);

#### （3）修改分区信息

##### A. 添加分区

静态分区

　　添加一个

> alter table student_ptn add partition(city="chongqing");


　  添加多个

> alter table student_ptn add partition(city="chongqing2") partition(city="chongqing3") partition(city="chongqing4");


动态分区

先向student_ptn表中插入数据，数据格式如下图

> load data local inpath "/home/hadoop/student.txt" into table student_ptn partition(city="beijing");

现在我把这张表的内容直接插入到另一张表student_ptn_age中，并实现sex为动态分区（不指定到底是哪中性别，让系统自己分配决定）

首先创建student_ptn_age并指定分区为age

> create table student_ptn_age(id int,name string,sex string,department string) partitioned by (age int);

从student_ptn表中查询数据并插入student_ptn_age表中

> insert overwrite table student_ptn_age partition(age)

> select id,name,sex,department，age from student_ptn;

##### B. 修改分区

修改分区，一般来说，都是指修改分区的数据存储目录

在添加分区的时候，直接指定当前分区的数据存储目录

> alter table student_ptn add if not exists partition(city='beijing')   
> location '/student_ptn_beijing' partition(city='cc') location '/student_cc';

修改已经指定好的分区的数据存储目录

> alter table student_ptn partition (city='beijing') set location '/student_ptn_beijing';

此时原先的分区文件夹仍存在，但是在往分区添加数据时，只会添加到新的分区目录


##### C. 删除分区

> alter table student_ptn drop partition (city='beijing');

### 4、删除表

> drop table new_student;

### 5、清空表

> truncate table student_ptn;


