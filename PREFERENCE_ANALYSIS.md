# Pairwise preference：正式收集前的分析方案

这是供导师确认并在正式收集前冻结的方案和可运行脚本，不代表已经预注册，也不代表已有真实人类验证结果。PAD 仍为单张场景评分，只有 preference 使用 pairwise。

## 1. 你要比较什么

主要问题是：**模型认为 A 比 B 更好时，人是否也更喜欢 A？** 不要求把人的相对选择转换成模型的 1–10 分。

示例仅用于解释：模型给 A=8、B=6；人选择“稍偏好 A”或“明显偏好 A”，都记为方向一致；选择 B，记为不一致。“明显”不算两票。模型差距为 2 分，不意味着人的选择也存在可直接比较的 2 分差距。

在问卷中 `-2/-1` 代表选择屏幕中的 A，`+1/+2` 代表 B，`0` 代表差不多。A/B 位置会随机化，分析使用保存的 `image_A_id`、`image_B_id`，不能将“左侧”当成固定场景。

## 2. 预先固定的规则

| 项目 | 本方案 |
|---|---|
| 主要结果 | 有明确人类偏好时的模型方向一致率 |
| 人选择 A/B | 模型方向相同记 1，相反记 0 |
| 人认为差不多 | 不进入主要一致率分母；另报平局比例与平局时模型绝对分差的中位数 |
| 模型两分完全相同，而人选择 A/B | 一致性记 0.5，另报数量；不根据验证结果调一个“近似相等”阈值 |
| Strong/slight | 相同方向权重，保留原始强度用于描述性检查 |
| 无法判断或图片加载失败 | 排除该条比较，不能编码为平局或中性 |
| Somewhat / En parte / En part | 主要分析保留；另报仅 Yes / Sí 的敏感性结果 |
| 置信区间 | 在每个分配区组内按参与者整体 bootstrap，主要结果 2,000 次；保留同一人的全部有效比较 |
| 排名 | 次要、探索性 Davidson 排名，包含人类平局；与模型比较 Spearman rho、Kendall tau-b |
| 排名不确定性 | 200 次区组内参与者 bootstrap，报告场景排名区间、rho 区间和有效拟合次数 |

一致率按有效的、非平局的人类比较加权，而不是先给每人或每场景平均后再平均。报告分母和排除数量，避免把高平局率下的条件一致率解释成所有回答的一致率。CI 为百分位区间；有效重复少于 20 次时不输出区间。区组样本很少时 bootstrap 仍可能低估不确定性，不应将窄区间理解为充分验证。

预处理默认只接受正式模式、当前 manifest、完整 10 PAD + 5 preference 题序、两个 attention check 均有记录的完成问卷；按招募来源及参与者编号排除重复提交（Prolific 使用 `prolific_pid`，自招使用 `participant_id`），并将两次 attention check 失败标记为待研究者复核的分析排除。这些不是自动拒付规则。重复文件按文件名顺序保留第一个通过检查的完成版本；正式分析前私下核对同一 `submission_key` 的重试，以及同一受试者的矛盾版本，不得挑选更符合模型的版本。不同自招编号或跨平台的同一自然人不能仅靠这些编号识别，需在招募管理中避免重复参加。

双入口版本的比较记录增加 `recruitment_source`，分析用 `participant_id` 带有 `local:` 或 `prolific:` 前缀。合并分析时报告两种来源的人数与构成，并在样本允许时分别分析来源，检验主要模型一致性结论是否稳健。人口特征缺失不自动排除评分；默认 Prolific `Sex` 不能当作问卷的 `gender_identity`。年龄、学历的平台导出需另行关联并记录编码映射，不能用学历给个人偏好增加权重。

如果存在语言切换，逐题的 `response_language` 表示该次提交时的语言（`es` 西班牙语、`ca` 加泰罗尼亚语、`en` 英语）；`language_history` 在会话摘要中。可描述 ES/CA/EN 分布及任务顺序效应，但不要把自选语言的差异解释为因果效应。

## 3. 为什么还要做排名

一致率回答“具体这对图，模型方向是否与人一致”；排名回答“综合多位参与者和多个对手，各场景的相对位置如何”。两者不能互相替代。

Davidson 模型为每个场景估计相对偏好参数，并另估一个平局参数。脚本采用 A 胜、B 胜、平局的三个 logits：`theta_A`、`theta_B`、`delta + (theta_A + theta_B)/2`；归一化后得到三个概率。为避免稀疏数据或完胜导致无穷参数，预先固定 ridge=0.001；输出中心化的相对参数，不把它重新映射为 1–10。

比较图断开时，脚本不输出一个虚假的全局排名。拟合失败、参数到达优化边界、bootstrap 有效次数及排名区间均需检查。每个场景只有五个不同对手，因此排名是次要证据，不能仅报告一张精确名次表。

平局扩展的原始方法：[Davidson (1970), On Extending the Bradley–Terry Model to Accommodate Ties in Paired Comparison Experiments](https://doi.org/10.1080/01621459.1970.10481082)。本文脚本额外采用上述固定正则化和重抽样规则，应在方法中披露。

## 4. 收集前先准备模型结果

冻结模型、图像 manifest、题目措辞和排除规则；模型不能再使用本次人类验证数据调参或做 preference 校准。预测必须使用这 50 个场景的同一主立面和环境输入，不能沿用旧照片库的预测。

下面的 `C:\PRIVATE` 是私有研究目录示例，必须换成真实的非公开目录。所有命令从问卷仓库运行；脚本会阻止将输出写进公开问卷仓库。

```powershell
node tools/prepare-preference.mjs --template C:\PRIVATE\model-predictions.json
```

生成的模板已列出真实的 50 个场景 ID 和 manifest fingerprint，分数为空，不是预测结果。填入冻结模型的真实 `preference_score`、`model_id` 和模型检查点的 `checkpoint_sha256`。分数必须全部为 1–10，缺失值不能自动补。检查点是单一文件时可用：

```powershell
Get-FileHash C:\PRIVATE\frozen-model.pt -Algorithm SHA256
```

若模型有多个文件，先建立包含全部检查点及配置的固定归档并记录其哈希，同时保留归档内容清单。不要用问卷代码版本号代替模型检查点哈希。

## 5. 收集后运行

将每个完整回答的 JSON 放在私有 `responses` 目录。支持直接下载的 trial-array JSON，或含 `payload_json` 字符串的对象。Netlify CSV 必须用 CSV 解析器先提取 payload，不能按逗号随意切分。`progress_backup` 是未完成备份，不能直接当作完成问卷。

```powershell
node tools/coverage-report.mjs C:\PRIVATE\responses
node tools/prepare-preference.mjs C:\PRIVATE\responses C:\PRIVATE\preference-data.json
python -m pip install numpy scipy
python tools/analyze_preference.py C:\PRIVATE\preference-data.json C:\PRIVATE\model-predictions.json --out C:\PRIVATE\preference-results-v1
```

推荐在研究用 Python 虚拟环境安装依赖，不改变训练环境。此实现用 NumPy 2.5.3、SciPy 1.18.1 通过合成数据测试；正式分析记录实际 Python/依赖版本。准备脚本和结果目录都拒绝覆盖已有输出，重新分析使用新名字，保留可审计版本。

`--include-preview` 只用于测试预处理，结果会带 preview 标记；正式报告不得混入这些记录。测试中的生成数据不是受试者反馈，不能用来报告模型效度。

## 6. 看哪些结果

- `preference_report.json`：主要一致率及 CI、平局率及 CI、敏感性结果、排名拟合情况、Spearman/Kendall、使用人数和比较数。
- `pair_counts.csv`：按真实场景 ID 归一后的 A 胜/B 胜/平局数量，不受屏幕换位影响。
- `human_ranking.csv`：相对排名及区间；最后一列明确是相对参数，**不是人类 1–10 偏好评分**。

这些结果和预处理数据应留在私有研究存储，尤其不能上传包含 Prolific ID 的 JSON。发布聚合结果前也应做去标识化和披露风险检查。

## 7. 可以放进论文的方法段落

> Preference validation will be based primarily on directional concordance between human pairwise choices and the ordering implied by the frozen model predictions. Strong and slight preferences will receive equal directional weight. Human ties will be excluded from the concordance denominator and reported separately; exact model ties will contribute 0.5 when the human response is decisive. Confidence intervals will be estimated by resampling participants within allocation blocks, retaining each participant's responses together. As a secondary analysis, a regularized Davidson model will estimate relative scene preferences while accommodating ties. The resulting ordering will be compared with the model using Spearman's rho and Kendall's tau-b, with ranking uncertainty reported. These intervals are conditional on the fixed stimulus set. No absolute preference MAE or RMSE will be calculated from the pairwise responses.

确认方案后可据此修改文章，目前脚本的存在不等于导师已同意或方案已预注册。有关区间只支持这组固定 Eixample 场景，不能据此宣称对新建筑、全巴塞罗那或其他文化的总体精度。PAD 的绝对误差分析仍需单独说明量表映射和测量假设。
