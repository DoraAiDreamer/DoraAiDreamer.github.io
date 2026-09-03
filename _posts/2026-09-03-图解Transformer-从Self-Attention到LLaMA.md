---
layout:     post
title:      图解 Transformer：一口气搞懂大模型的骨架
subtitle:   不背公式——跟着 GPT-2 和 LLaMA 的真实数据流，用图、表和 PyTorch 把 Self-Attention 讲明白
date:       2026-09-03
author:     DoraAiDreamer
category:   机器学习
header-img: img/post-bg-universe.jpg
catalog: true
tags:
    - 深度学习
    - Transformer
    - 大模型
    - Attention
    - PyTorch
---

> 本文把 2017 年的《Attention Is All You Need》讲清楚，并以两个真实模型为解剖样本：**GPT-2 small**（经典 decoder，`d=768`、12 层）和 **LLaMA 2 7B**（现代 LLM，`d=4096`、32 层）。不讲玄学，只讲**数据流、shape、公式和代码**。
>
> 参考：[poloclub Transformer Explainer](https://poloclub.github.io/transformer-explainer/)（GPT-2 可视化）、[inferloop LLM Infra](https://inferloop.dev/llm-infra/transformer/)（数据流视角）、Jay Alammar *Illustrated Transformer*、Karpathy *nanoGPT*。

---

# 1. 一句话讲清楚 Transformer

Transformer 本质上是一个函数：**输入一串 token ID，输出下一个 token 的概率分布**。

- 它由 Google 在 2017 年论文 [*Attention Is All You Need*](https://arxiv.org/abs/1706.03762) 提出，核心创新是 **Self-Attention（自注意力）**：让序列里任意两个位置直接交换信息，不再依赖 RNN/CNN 的递归或卷积。
- 它是 GPT、LLaMA、Gemini、DeepSeek、Qwen 等几乎所有现代大模型的骨架。
- 文本生成靠的是 **next-token prediction（下一个 token 预测）**：给一句话，预测最可能接在后面的那个词（或子词），然后把它拼回去再预测下一个，循环往复——这叫**自回归（autoregressive）**。

先给两个贯穿全文的「解剖样本」：

| 配置 | GPT-2 small（经典） | LLaMA 2 7B（现代） |
| --- | --- | --- |
| 参数量 | 124 M（1.24 亿） | 6.7 B（约 70 亿） |
| 隐藏维度 `d_model` | 768 | 4096 |
| Transformer 层数 `L` | 12 | 32 |
| 注意力头数 `H` | 12 | 32 |
| 每头维度 `head_dim` | 64 | 128 |
| FFN 中间维度 | 3072（4×） | 11008 |
| 词表大小 `V` | 50,257 | 32,000 |
| 位置编码 | 学习式（learned） | RoPE（旋转式） |
| 归一化 | LayerNorm | RMSNorm |
| FFN 激活 | GELU | SwiGLU |
| 注意力 | MHA | MHA（7B）/ GQA（70B、LLaMA 3） |

下面这张图是全文的总纲——文本是如何一步步变成概率的：

<figure>
<svg viewBox="0 0 560 430" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,'PingFang SC','Microsoft YaHei',sans-serif">
  <defs>
    <marker id="ar" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill="#0085a1"/>
    </marker>
  </defs>
  <!-- boxes -->
  <g font-size="15" text-anchor="middle">
    <rect x="130" y="18"  width="300" height="56" rx="10" fill="#f2f8fa" stroke="#0085a1" stroke-width="1.5"/>
    <text x="280" y="42" font-weight="bold" fill="#006377">① Tokenize 分词</text>
    <text x="280" y="62" font-size="12" fill="#888">文本 → token ID　shape: [n]</text>

    <rect x="130" y="102" width="300" height="56" rx="10" fill="#f2f8fa" stroke="#0085a1" stroke-width="1.5"/>
    <text x="280" y="126" font-weight="bold" fill="#006377">② Token Embedding + 位置编码</text>
    <text x="280" y="146" font-size="12" fill="#888">查表 + 注入位置　shape: [n, d]</text>

    <rect x="130" y="186" width="300" height="66" rx="10" fill="#d9eef3" stroke="#0085a1" stroke-width="2.2"/>
    <text x="280" y="212" font-weight="bold" fill="#006377">③ Transformer Block × L</text>
    <text x="280" y="232" font-size="12" fill="#006377">Attention + FFN + Norm + 残差</text>
    <text x="280" y="246" font-size="12" fill="#888">shape: [n, d] → [n, d]</text>

    <rect x="130" y="282" width="300" height="56" rx="10" fill="#f2f8fa" stroke="#0085a1" stroke-width="1.5"/>
    <text x="280" y="306" font-weight="bold" fill="#006377">④ Final Norm → LM Head</text>
    <text x="280" y="326" font-size="12" fill="#888">shape: [n, d] → [n, V]</text>

    <rect x="130" y="366" width="300" height="50" rx="10" fill="#e8f3f6" stroke="#0085a1" stroke-width="1.5"/>
    <text x="280" y="388" font-weight="bold" fill="#006377">⑤ Softmax + 采样</text>
    <text x="280" y="406" font-size="12" fill="#888">概率分布 → 下一个 token</text>
  </g>
  <!-- arrows -->
  <g stroke="#0085a1" stroke-width="2" fill="none">
    <line x1="280" y1="74"  x2="280" y2="100" marker-end="url(#ar)"/>
    <line x1="280" y1="158" x2="280" y2="184" marker-end="url(#ar)"/>
    <line x1="280" y1="252" x2="280" y2="280" marker-end="url(#ar)"/>
    <line x1="280" y1="338" x2="280" y2="364" marker-end="url(#ar)"/>
  </g>
</svg>
</figure>

*图 1：Decoder-only Transformer（GPT/LLaMA 都是这种）的完整数据流。全文就按这 5 步展开。*

---

# 2. 先建立两个直觉

## 2.1 「投影」其实就是一次矩阵乘法

论文和代码里高频出现的 **projection（投影）**、`q_proj`、`gate_proj`，听着抽象，实际就是**一个全连接层 `nn.Linear` = 一次矩阵乘法**。前端同学可以理解成 `q = matmul(x, W_q)`。Transformer 里几乎所有参数都是这些矩阵里的数字。

## 2.2 Q / K / V：一次「带权重的搜索」

Self-Attention 用三个投影矩阵把每个 token 的向量变成三种角色，用搜索引擎类比最好懂：

| 角色 | 全称 | 搜索类比 | 作用 |
| --- | --- | --- | --- |
| **Q** | Query 查询 | 你在搜索框输入的关键词 | 当前 token「想找什么信息」 |
| **K** | Key 键 | 每个网页的标题 | 每个 token「能被什么匹配到」 |
| **V** | Value 值 | 网页的实际内容 | 真正要取走、聚合的信息 |

每个 token 拿自己的 Q 去和所有 token 的 K 算相关性（点积），得到一组权重；再用这组权重对所有 V 做加权求和——相关性高的 token 多拿点信息，相关性低的少拿。这就是注意力。

---

# 3. 第 1 步：Tokenization 与 Embedding

## 3.1 分词：文本 → token ID

模型只认识数字，所以先把文本切成 **token**（可能是一个词、一个子词或一个标点），再映射成词表里的 ID。主流分词算法是 **BPE（Byte Pair Encoding）**，思想极简：

```
初始:   l o w e r      # 从字符开始
第 1 轮: lo w e r      # l+o 共现最频繁 → 合并成 lo
第 2 轮: low e r       # lo+w 合并
第 3 轮: lower         # low+er 合并
```

高频词（the、is）会成为完整 token，低频词被拆成子词：`unhappiness → un + happ + iness`。三种主流分词库：

| 特性 | tiktoken（OpenAI） | SentencePiece（Google） | HF Tokenizers |
| --- | --- | --- | --- |
| 算法 | BPE（byte-level） | BPE / Unigram | BPE / WordPiece / Unigram |
| 实现 | Rust + Python | C++ + Python | Rust + Python |
| 用户 | GPT-4 / GPT-4o | LLaMA、T5、Gemma | BERT 及众多 HF 模型 |
| 中文 | byte-level 回退 | 原生支持 | 取决于模型 |

> **中文的坑**：英文有天然空格分词，中文没有。同一句「大语言模型的推理优化」，tiktoken 可能切 5 个 token，SentencePiece（LLaMA）可能切 7 个。这也是 Qwen、Yi 等中文模型特意扩充中文词表（Qwen2 词表 15 万+）的原因——同样内容更省 token、更快更便宜。

## 3.2 Token Embedding：ID → 稠密向量

查表得到每个 token 的向量。GPT-2 把每个 token 表示成 **768 维**向量，存在一个 `(50257, 768)` 的矩阵里——约 3900 万个参数；LLaMA 2 是 `(32000, 4096)`。语义相近的词在这个高维空间里距离更近。

## 3.3 位置编码：为什么必须有

Self-Attention 本身**对顺序无感**——把句子里的词打乱，每个 token 聚合到的信息集合不变。但「狗咬人」和「人咬狗」天差地别。所以必须显式注入「你是第几个 token」。三种主流做法：

| 方式 | 代表模型 | 做法 | 特点 |
| --- | --- | --- | --- |
| 学习式 PE | GPT-2 | 直接训练一个位置嵌入矩阵，和 token 嵌入**相加** | 简单，但外推到更长序列较弱 |
| 正弦 PE | 原始 Transformer | 用 sin/cos 固定函数生成位置向量相加 | 无需学习，可外推 |
| **RoPE** 旋转位置编码 | LLaMA / Qwen / DeepSeek | 把位置编码成**旋转角度**，通过乘法作用在 Q、K 上（不作用于 V） | 长上下文外推好，现代 LLM 标配 |

Embedding 阶段的代码（以 GPT-2 配置为例）：

```python
import torch
import torch.nn as nn

class Config:
    vocab = 50257     # 词表大小 V
    d = 768           # 隐藏维度
    max_len = 1024    # 最大序列长度
cfg = Config()

# token 嵌入：查表 [V, d]；位置嵌入（GPT-2 学习式）：[max_len, d]
tok_emb = nn.Embedding(cfg.vocab, cfg.d)
pos_emb = nn.Embedding(cfg.max_len, cfg.d)

ids = torch.tensor([[1234, 5678, 9012]])   # [batch=1, n=3]，3 个 token ID
pos = torch.arange(ids.size(1))             # 位置 [0, 1, 2]

x = tok_emb(ids) + pos_emb(pos)             # 逐位置相加 → [1, 3, 768]
print(x.shape)                              # torch.Size([1, 3, 768])
```

RoPE 的核心思想是把向量每相邻两维看作平面坐标，按位置旋转一个角度（频率不同），下面是简化实现：

```python
def precompute_rope(head_dim, max_len, base=10000.0):
    inv_freq = 1.0 / (base ** (torch.arange(0, head_dim, 2).float() / head_dim))
    t = torch.arange(max_len).float()
    freqs = torch.outer(t, inv_freq)              # [max_len, head_dim/2]
    return torch.cos(freqs), torch.sin(freqs)

def apply_rope(x, cos, sin):
    # x: [batch, heads, n, head_dim]
    cos, sin = cos[: x.size(2)], sin[: x.size(2)]
    x1, x2 = x[..., 0::2], x[..., 1::2]           # 相邻两维配对
    rot = torch.stack([x1 * cos - x2 * sin,
                       x1 * sin + x2 * cos], dim=-1)
    return rot.flatten(-2)                        # 旋转后形状不变
```

---

# 4. 第 2 步：核心 —— Self-Attention

## 4.1 公式与 shape

把第 2.2 节的「加权搜索」写成数学，就是论文里最核心的一个公式：

```
Attention(Q, K, V) = softmax( Q · Kᵀ / √d_k ) · V
```

一步步拆开（`n` = token 数，`d` = 向量维度，`@` 表示矩阵乘法）：

```
Q = X @ W_q      # [n, d] → [n, d]
K = X @ W_k      # [n, d] → [n, d]
V = X @ W_v      # [n, d] → [n, d]

scores = Q @ Kᵀ            # [n, d] @ [d, n] → [n, n]   ← O(n²)
scores = scores / √d_k     # 缩放
weights = softmax(scores)  # 每行归一化成概率，行内和为 1 → [n, n]
output = weights @ V       # [n, n] @ [n, d] → [n, d]
```

| 步骤 | 操作 | shape | 含义 |
| --- | --- | --- | --- |
| ① | `Q @ Kᵀ` | `[n, d]→[n, n]` | 每个 token 与每个 token 的相关性分数 |
| ② | `/ √d_k` | `[n, n]` | 缩放，防止点积过大 |
| ③ | causal mask | `[n, n]` | 把「未来」位置置为 −∞ |
| ④ | `softmax` | `[n, n]` | 每行变成和为 1 的注意力权重 |
| ⑤ | `@ V` | `[n, n]→[n, d]` | 按权重聚合所有 token 的信息 |

<figure>
<svg viewBox="0 0 620 470" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,'PingFang SC','Microsoft YaHei',sans-serif">
  <defs>
    <marker id="ar2" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill="#0085a1"/>
    </marker>
  </defs>
  <!-- top Q K V -->
  <g font-size="15" font-weight="bold" text-anchor="middle">
    <rect x="70"  y="16" width="120" height="48" rx="8" fill="#e8f3f6" stroke="#0085a1"/>
    <text x="130" y="45" fill="#006377">Q [n,d]</text>
    <rect x="250" y="16" width="120" height="48" rx="8" fill="#e8f3f6" stroke="#0085a1"/>
    <text x="310" y="45" fill="#006377">K [n,d]</text>
    <rect x="430" y="16" width="120" height="48" rx="8" fill="#e8f3f6" stroke="#0085a1"/>
    <text x="490" y="45" fill="#006377">V [n,d]</text>
  </g>
  <!-- center steps -->
  <g font-size="14" text-anchor="middle">
    <rect x="180" y="112" width="260" height="44" rx="8" fill="#f2f8fa" stroke="#0085a1"/>
    <text x="310" y="139" fill="#333">MatMul：Q · Kᵀ　[n, n]</text>

    <rect x="180" y="180" width="260" height="40" rx="8" fill="#f2f8fa" stroke="#0085a1"/>
    <text x="310" y="205" fill="#333">Scale：÷ √d_k</text>

    <rect x="180" y="242" width="260" height="44" rx="8" fill="#f2f8fa" stroke="#0085a1"/>
    <text x="310" y="269" fill="#333">Mask：未来位置 → −∞</text>

    <rect x="180" y="308" width="260" height="44" rx="8" fill="#f2f8fa" stroke="#0085a1"/>
    <text x="310" y="335" fill="#333">Softmax：每行和为 1</text>

    <rect x="180" y="378" width="260" height="48" rx="8" fill="#d9eef3" stroke="#0085a1" stroke-width="2"/>
    <text x="310" y="407" font-weight="bold" fill="#006377">MatMul · V → [n, d]</text>
  </g>
  <!-- arrows -->
  <g stroke="#0085a1" stroke-width="2" fill="none">
    <line x1="130" y1="64" x2="250" y2="110" marker-end="url(#ar2)"/>
    <line x1="310" y1="64" x2="310" y2="110" marker-end="url(#ar2)"/>
    <line x1="310" y1="156" x2="310" y2="178" marker-end="url(#ar2)"/>
    <line x1="310" y1="220" x2="310" y2="240" marker-end="url(#ar2)"/>
    <line x1="310" y1="286" x2="310" y2="306" marker-end="url(#ar2)"/>
    <line x1="310" y1="352" x2="310" y2="376" marker-end="url(#ar2)"/>
    <!-- V 走右侧长线下到最后一步 -->
    <polyline points="490,64 490,402 442,402" stroke-dasharray="5,4" marker-end="url(#ar2)"/>
  </g>
</svg>
</figure>

*图 2：Scaled Dot-Product Attention。Q 和 K 先算出 `[n,n]` 的相关性矩阵，经缩放、掩码、softmax 后，再与 V 相乘完成信息聚合。*

## 4.2 为什么要除以 √d_k

Q、K 各维可近似看作均值 0、方差 1 的随机变量，它们的点积（`d_k` 项乘积之和）方差为 `d_k`。当 `d_k=128` 时点积数值会很大，把 softmax 推进饱和区（梯度趋近 0、几乎 one-hot），训练不动。除以 `√d_k` 把方差拉回 1，让 softmax 保持平滑。

## 4.3 因果掩码（Causal Mask）

生成模型只能「看过去」，不能偷看未来。做法是在 softmax 之前把 `[n,n]` 分数矩阵的**上三角（未来位置）置为 −∞**，softmax 后这些位置权重变成 0。以 3 个 token 为例（✓ = 可关注，✗ = 被掩码）：

| 当前 token | 关注 token₁ | 关注 token₂ | 关注 token₃ |
| --- | :-: | :-: | :-: |
| token₁ | ✓ | ✗ | ✗ |
| token₂ | ✓ | ✓ | ✗ |
| token₃ | ✓ | ✓ | ✓ |

## 4.4 PyTorch 实现

```python
import torch.nn.functional as F

def scaled_dot_product_attention(Q, K, V, mask=None):
    # Q, K, V: [batch, heads, n, head_dim]
    d_k = Q.size(-1)
    scores = Q @ K.transpose(-2, -1) / (d_k ** 0.5)   # [B, H, n, n]
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))
    weights = F.softmax(scores, dim=-1)                # 每行归一化
    return weights @ V                                 # [B, H, n, head_dim]

# 因果掩码：下三角为 1（可看自己和过去），上三角为 0
n = 3
causal_mask = torch.tril(torch.ones(n, n)).view(1, 1, n, n)
# tensor([[[[1., 0., 0.],
#           [1., 1., 0.],
#           [1., 1., 1.]]]])
```

> PyTorch 2.0+ 内置了融合优化版 `F.scaled_dot_product_attention(Q, K, V, is_causal=True)`，底层会自动调用 FlashAttention / memory-efficient kernel，生产代码直接用它即可。

---

# 5. 第 3 步：Multi-Head Attention（多头注意力）

## 5.1 为什么要多头

一个注意力头只能学一种「关注模式」。把 `d` 维拆成 `H` 个头、每头 `head_dim = d / H` 维，**每个头独立做注意力**，就能同时从不同视角看句子：有的头盯相邻词（语法），有的头盯主谓一致，有的头盯长距离指代。计算量和单头基本不变，但表达能力更强。

- GPT-2：768 维 = 12 头 × 64 维
- LLaMA 2：4096 维 = 32 头 × 128 维

数据流（以 GPT-2、`n` 个 token 为例）：

```
X [n, 768]
  │  三个投影 Wq Wk Wv（可合并成一个 768→3·768 的线性层）
  ▼
Q,K,V [n, 768]  ──拆成 12 头──►  [n, 12, 64] ──转置──► [12, n, 64]（每头独立）
  │
  ▼  每头各自 scaled-dot-product attention（并行）
[n, 12, 64]  ──拼回──►  [n, 768]
  │  输出投影 Wo
  ▼
[n, 768]
```

## 5.2 代码实现

```python
class MultiHeadSelfAttention(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.H, self.hd = cfg.n_heads, cfg.head_dim
        self.qkv = nn.Linear(cfg.d, 3 * cfg.d)      # 合并 Q/K/V 投影
        self.proj = nn.Linear(cfg.d, cfg.d)         # 输出投影 Wo

    def forward(self, x):
        B, n, _ = x.shape
        qkv = self.qkv(x).reshape(B, n, 3, self.H, self.hd)
        qkv = qkv.permute(2, 0, 3, 1, 4)           # [3, B, H, n, hd]
        Q, K, V = qkv[0], qkv[1], qkv[2]           # 各 [B, H, n, hd]

        mask = torch.tril(torch.ones(n, n, device=x.device)).view(1, 1, n, n)
        out = scaled_dot_product_attention(Q, K, V, mask)   # [B, H, n, hd]

        out = out.transpose(1, 2).reshape(B, n, -1)        # 拼头 → [B, n, d]
        return self.proj(out)
```

## 5.3 MHA / GQA / MQA：省 KV Cache 的演进

推理时要缓存历史 token 的 K、V（第 8 节讲原因）。现代模型通过让多个 Q 头共享 K/V 头来压缩缓存：

| 方案 | Q 头 | K/V 头 | KV Cache | 精度 | 代表 |
| --- | :-: | :-: | --- | --- | --- |
| **MHA** 多头 | 32 | 32 | 1×（基准） | 最好 | GPT-2、LLaMA 2 7B |
| **GQA** 分组查询 | 32 | 8 | 约 1/4 | 损失 <1% | LLaMA 3、LLaMA 2 70B、Mistral、Qwen2 |
| **MQA** 多查询 | 32 | 1 | 约 1/32 | 略降 | 早期 PaLM、Falcon |

```
MHA:  Q 32 头 │ K 32 头 │ V 32 头
GQA:  Q 32 头 │ K  8 头 │ V  8 头   （每 4 个 Q 头共享 1 组 KV）
MQA:  Q 32 头 │ K  1 头 │ V  1 头   （所有 Q 头共享同 1 组 KV）
```

GQA 已基本成为现代 LLM 的标配；DeepSeek 还进一步提出 MLA（多头潜在注意力）把 K/V 压成低维潜变量。

---

# 6. 第 4 步：Transformer Block（Attention + FFN + Norm + 残差）

## 6.1 一个 Block 的结构

单个 Block 是固定积木，整个模型靠它堆叠 `L` 次（GPT-2 堆 12 次，LLaMA 2 堆 32 次）。现代模型采用 **Pre-Norm**（先归一化再进子层），并在每个子层外包一条**残差连接**：

```
                 x  [n, d]
                 │
        ┌────────┴────────┐  ← 残差（把输入短路）
        ▼                 │
     Norm ①               │
        │                 │
   Multi-Head Attention   │
        │                 │
        ▼                 │
       ⊕  ←───────────────┘   x = x + Attention(Norm(x))
        │
        ├────────┐  ← 残差
        ▼        │
     Norm ②     │
        │       │
      FFN/MLP   │
        │       │
        ▼       │
       ⊕  ←─────┘            x = x + FFN(Norm(x))
        │
        ▼
      输出 [n, d]  →  进入下一个 Block
```

两个关键配角：

- **残差连接（Residual）**：`x = x + 子层(Norm(x))`，让梯度有一条「高速公路」直通浅层，缓解深层网络的梯度消失，这是能堆几十上百层的前提。
- **归一化（Norm）**：稳定数值分布、加速收敛。

## 6.2 LayerNorm vs RMSNorm

| | LayerNorm（GPT-2、BERT） | RMSNorm（LLaMA、Qwen） |
| --- | --- | --- |
| 做法 | 减均值、除标准差，再缩放平移 | 只用均方根缩放，不减均值 |
| 计算量 | 较大 | 更小、更快 |
| 公式 | `(x−μ)/σ · γ + β` | `x / rms(x) · γ` |

```python
class RMSNorm(nn.Module):
    def __init__(self, d, eps=1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(d))   # γ
        self.eps = eps
    def forward(self, x):
        norm = x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)
        return norm * self.weight
```

## 6.3 FFN / MLP：逐 token 的「特征过滤器」

Attention 负责 **token 之间**路由信息；FFN（Feed-Forward Network，也叫 MLP）对**每个 token 独立**做非线性变换，负责提炼、存储知识。结构是「升维 → 激活 → 降维」：

- **GPT-2（GELU）**：768 → 3072（4 倍）→ GELU → 768
- **LLaMA（SwiGLU）**：用门控结构，3 个矩阵 `gate/up/down`，中间维度 11008

```python
class GPT2_MLP(nn.Module):                       # GPT-2：两层线性 + GELU
    def __init__(self, cfg):
        super().__init__()
        self.fc1 = nn.Linear(cfg.d, cfg.ffn)    # 768 → 3072（升维）
        self.fc2 = nn.Linear(cfg.ffn, cfg.d)    # 3072 → 768（降维）
    def forward(self, x):
        return self.fc2(F.gelu(self.fc1(x)))

class SwiGLU_FFN(nn.Module):                    # LLaMA：门控 FFN
    def __init__(self, d, hidden):
        super().__init__()
        self.gate = nn.Linear(d, hidden, bias=False)
        self.up   = nn.Linear(d, hidden, bias=False)
        self.down = nn.Linear(hidden, d, bias=False)
    def forward(self, x):
        return self.down(F.silu(self.gate(x)) * self.up(x))   # silu 即 Swish
```

> 一个有用的经验：**FFN 是参数量大头**。LLaMA 2 7B 每层 FFN 约 135M 参数，而注意力投影约 67M——FFN 占了约 63%。

## 6.4 拼装一个 Block

```python
class TransformerBlock(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.ln1  = nn.LayerNorm(cfg.d)    # LLaMA 换成 RMSNorm
        self.attn = MultiHeadSelfAttention(cfg)
        self.ln2  = nn.LayerNorm(cfg.d)
        self.ffn  = GPT2_MLP(cfg)          # LLaMA 换成 SwiGLU_FFN

    def forward(self, x):
        x = x + self.attn(self.ln1(x))     # Pre-Norm + 残差
        x = x + self.ffn(self.ln2(x))
        return x
```

---

# 7. 第 5 步：输出层与采样

所有 Block 处理完后，取**最后一个位置**的向量，映射到词表大小得到 **logits（原始分数，可正可负，未归一化）**，再 softmax 成概率：

```
[n, d] ──Final Norm──► [n, d] ──Linear Head──► [n, V]
                                              取最后位置 → [V] 个 logits
                                              ──softmax──► 每个 token 的概率
```

```python
class GPT(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.tok_emb = nn.Embedding(cfg.vocab, cfg.d)
        self.pos_emb = nn.Embedding(cfg.max_len, cfg.d)
        self.blocks  = nn.ModuleList([TransformerBlock(cfg) for _ in range(cfg.n_layers)])
        self.ln_f    = nn.LayerNorm(cfg.d)
        self.head    = nn.Linear(cfg.d, cfg.vocab, bias=False)   # LM Head

    def forward(self, ids):                   # ids: [B, n]
        B, n = ids.shape
        x = self.tok_emb(ids) + self.pos_emb(torch.arange(n, device=ids.device))
        for blk in self.blocks:
            x = blk(x)
        x = self.ln_f(x)
        logits = self.head(x)                # [B, n, V]
        return logits[:, -1, :]              # 只取最后位置 → [B, V]
```

**采样**决定了输出的「确定 vs 随机」。三个旋钮：

| 机制 | 作用 | 调节效果 |
| --- | --- | --- |
| **temperature** 温度 | `logits / T` 再 softmax | `T<1` 更确定保守；`T>1` 更随机「有创意」；`T=1` 原样 |
| **top-k** | 只在概率最高的 k 个 token 里采 | k 越小越保守 |
| **top-p**（nucleus） | 只在累计概率达到 p 的最小集合里采 | p 越小越保守 |

```python
def sample(logits, temperature=1.0, top_k=None, top_p=None):
    logits = logits / temperature
    probs = F.softmax(logits, dim=-1)

    if top_k:                                  # top-k 截断
        v, _ = torch.topk(probs, min(top_k, probs.size(-1)))
        probs[probs < v[..., [-1]]] = 0
    if top_p:                                  # top-p（nucleus）截断
        sp, idx = torch.sort(probs, descending=True)
        sp[(sp.cumsum(-1) - sp) > top_p] = 0
        probs = torch.zeros_like(probs).scatter_(-1, idx, sp)

    probs = probs / probs.sum(-1, keepdim=True)
    return torch.multinomial(probs, 1)         # 按概率抽一个 token
```

生成时把采样出的 token 拼回输入，重复 forward，就是自回归生成。

---

# 8. 规模直觉：参数怎么数、注意力有多贵

## 8.1 参数分布

**GPT-2 small（约 124M）**：

| 组件 | 计算 | 参数量 |
| --- | --- | --- |
| Token Embedding | 50257 × 768 | ≈ 38.6 M |
| Position Embedding | 1024 × 768 | ≈ 0.8 M |
| 每层 Attention | (768×2304) + (768×768) | ≈ 2.4 M |
| 每层 MLP | 2 × (768×3072) | ≈ 4.7 M |
| 12 层合计 | 12 × (2.4+4.7) | ≈ 85 M |
| LM Head | 768 × 50257（常与 Embedding 共享） | ≈ 38.6 M |

**LLaMA 2 7B（每层，d=4096、ffn=11008）**：

| 组件 | 计算 | 参数量 | 占比 |
| --- | --- | --- | --- |
| Q/K/V/O 投影 | 4 × 4096² | 67 M | 31% |
| FFN（gate/up/down） | 3 × 4096 × 11008 | 135 M | 63% |
| RMSNorm | 2 × 4096 | 8 K | ~0% |

每层约 202M，32 层 ≈ 6.5B，加上 Embedding/Head 约 **6.7B ≈ 7B**。

> **显存直觉**：FP16（半精度，推理默认）下每个参数占 2 字节，**1B 参数 ≈ 2GB 显存**。7B 模型权重约 14GB；70B 约 140GB（一张 A100 80GB 装不下，必须多卡或量化）。

## 8.2 注意力是 O(n²)

`Q @ Kᵀ` 生成 `[n, n]` 矩阵，n 是序列长度。长度翻倍，注意力的计算量和显存变 **4 倍**：

| 序列长度 | 注意力矩阵元素 | 单层单头显存(FP16) | 相对 4K |
| --- | --- | --- | --- |
| 2K | 4 M | 8 MB | — |
| 4K | 16 M | 32 MB | 1× |
| 32K | 1024 M | 2 GB | 64× |
| 128K | 16384 M | 32 GB | 1024× |

## 8.3 KV Cache：自回归为什么要缓存

不用缓存时，每生成一个 token 都要把整段历史重新算一遍注意力，历史 token 的 K、V 其实没变、纯属重复：

```
无缓存：
  输入 [A,B,C]        → 算全部 → 生成 D
  输入 [A,B,C,D]      → 又算全部 → 生成 E
  输入 [A,B,C,D,E]    → 又算全部 → 生成 F

有 KV Cache：
  输入 [A,B,C]        → 算出 K_ABC,V_ABC 并缓存 → 生成 D
  只输入 [D]          → 算 K_D,V_D，拼上缓存 → 生成 E
  只输入 [E]          → 算 K_E,V_E，拼上缓存 → 生成 F
```

缓存大小（batch、层数、KV 头数、长度都会放大）：

```
KV Cache = 2(K和V) × 层数 × KV头数 × head_dim × 序列长度 × batch × 字节数
```

LLaMA 2 7B（32 KV 头）在 `seq=2048、batch=1` 时 KV Cache 约 **1GB**；`batch=32` 时就到 **32GB**。这正是推理引擎要做 **PagedAttention（vLLM，按页管理 KV Cache）**、**FlashAttention（分块减少显存读写）**、**GQA/MQA（压缩 KV 头）** 的根本原因——靠堆显存根本撑不住长上下文和高并发。

> 想深入推理引擎如何解决这些问题，见本站 [推理加速专栏](/inference/)（vLLM 源码解读，站内即可阅读）：PagedAttention、调度与 KV Cache、分布式并行都有专门篇章。

---

# 9. 一张速查表总结

**Transformer Block 内的数据流（shape 以 GPT-2 为例）**：

| 阶段 | 操作 | shape 变化 |
| --- | --- | --- |
| 输入 | token ID | `[n]` |
| Embedding | tok + pos | `[n] → [n, 768]` |
| Attention | QKV 投影 | `[n,768] → [n,12,64]` |
| Attention | QKᵀ/scale/mask/softmax | `→ [12, n, n]` |
| Attention | ·V + 拼头 + 输出投影 | `→ [n, 768]` |
| FFN | 升维 → GELU → 降维 | `[n,768]→[n,3072]→[n,768]` |
| 输出 | Final Norm + Head | `[n,768] → [n, 50257]` |
| 采样 | softmax + temperature/top-k/top-p | `[50257] → 1 个 token` |

**经典 vs 现代 Decoder 的差异**：

| 维度 | GPT-2（2019） | LLaMA 2（2023） |
| --- | --- | --- |
| 位置编码 | 学习式相加 | RoPE 旋转（作用于 Q/K） |
| 归一化 | LayerNorm | RMSNorm |
| FFN | GELU，2 矩阵 | SwiGLU，3 矩阵门控 |
| 注意力 | MHA | MHA / GQA |
| 偏置 bias | 线性层多带 bias | 大多去掉 bias |

**核心术语**：token / embedding / projection（=Linear）/ Q·K·V / self-attention / multi-head / causal mask / FFN(MLP) / residual / LayerNorm·RMSNorm / RoPE / SwiGLU·GELU / GQA / logits / softmax / KV Cache。

---

# 10. 参考资料

- 论文：[Attention Is All You Need (2017)](https://arxiv.org/abs/1706.03762)
- 可视化交互：[Transformer Explainer — poloclub](https://poloclub.github.io/transformer-explainer/)（基于 GPT-2，可点选观察注意力权重）
- 数据流与推理视角：[inferloop · LLM Infra / Transformer](https://inferloop.dev/llm-infra/transformer/)
- 图解经典：Jay Alammar [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) / [Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/)
- 视频直觉：3Blue1Brown *Attention in transformers*
- 从零实现：Andrej Karpathy [nanoGPT](https://github.com/karpathy/nanoGPT) / *Let's build GPT*
- 推理优化（本站专栏）：[推理加速专栏](/inference/)（vLLM 源码解读，站内阅读）

> 一句话收尾：**整个 Transformer 就是一堆矩阵乘法（GEMM）加少量逐元素操作（norm、激活）**。Attention 负责让 token 互相通信，FFN 负责逐个提炼特征，残差和归一化负责让几十层堆得动——剩下的都是工程与规模。
