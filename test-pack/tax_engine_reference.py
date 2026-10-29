"""Reference deterministic engine, FY 2025-26 / AY 2026-27. Use to cross-check taxEngine.ts."""
def slab(income, slabs):
    tax, prev = 0, 0
    for upto, rate in slabs:
        if income > prev:
            tax += (min(income, upto) - prev) * rate
        prev = upto
    return tax
INF = float("inf")
NEW = [(400000,0),(800000,.05),(1200000,.10),(1600000,.15),(2000000,.20),(2400000,.25),(INF,.30)]
OLD = [(250000,0),(500000,.05),(1000000,.20),(INF,.30)]

def hra_exempt(hra, basic, rent, metro=True):
    return max(0, min(hra, (.5 if metro else .4)*basic, rent - .1*basic))

def compute(i, regime):
    sal = i["gross_salary"]
    other = i.get("interest_savings",0)+i.get("interest_fd",0)+i.get("dividend",0)+i.get("other_income",0)
    stcg, ltcg = i.get("stcg_111a",0), i.get("ltcg_112a",0)
    ltcg_taxable = max(0, ltcg - 125000)
    ded = {}
    if regime == "new":
        std = 75000; hra = 0; pt = 0
        ded["80CCD(2)"] = min(i.get("employer_nps",0), .10*i["basic"])
        other_inc = other
    else:
        std = 50000; hra = hra_exempt(i["hra"], i["basic"], i.get("rent_paid",0)); pt = i.get("professional_tax",0)
        ded["80C"] = min(150000, i.get("sec80c",0))
        ded["80D"] = min(25000, i.get("d_self",0)) + min(50000, i.get("d_parents",0))
        ded["80CCD(1B)"] = min(50000, i.get("nps_1b",0))
        ded["80CCD(2)"] = min(i.get("employer_nps",0), .10*i["basic"])
        ded["80TTA"] = min(10000, i.get("interest_savings",0))
        other_inc = other
    salary_income = sal - hra - std - pt
    gross_total_normal = salary_income + other_inc
    total_ded = sum(ded.values())
    normal = max(0, gross_total_normal - total_ded)
    total_income = normal + stcg + ltcg_taxable
    base = slab(normal, NEW if regime=="new" else OLD)
    t_stcg, t_ltcg = .20*stcg, .125*ltcg_taxable
    rebate = 0
    if regime=="new" and total_income <= 1200000: rebate = min(base, 60000)
    if regime=="old" and total_income <= 500000: rebate = min(base, 12500)
    base_after = base - rebate
    marginal = 0
    if regime == "new" and total_income > 1200000:
        limit = total_income - 1200000          # 87A marginal relief
        gross_tax = base + t_stcg + t_ltcg
        if gross_tax > limit:
            marginal = max(0, gross_tax - limit)
    base_after = base - rebate - marginal
    tax_before_cess = base_after + t_stcg + t_ltcg
    cess = round(.04*tax_before_cess)
    return dict(regime=regime, salary_income=salary_income, hra_exemption=hra, standard_deduction=std,
        professional_tax=pt, other_income=other_inc, chapter_VIA=ded, total_deductions=total_ded,
        normal_taxable_income=normal, stcg_111a=stcg, ltcg_112a_taxable=ltcg_taxable, total_income=total_income,
        tax_on_normal=base, tax_stcg=t_stcg, tax_ltcg=t_ltcg, rebate_87A=rebate, marginal_relief=max(marginal,0),
        tax_before_cess=tax_before_cess, cess=cess, total_tax=tax_before_cess+cess)

def compare(i, tds=0):
    n, o = compute(i,"new"), compute(i,"old")
    best = "new" if n["total_tax"] <= o["total_tax"] else "old"
    b = n if best=="new" else o
    return dict(new=n, old=o, recommended=best, savings=abs(n["total_tax"]-o["total_tax"]),
                tds_credit=tds, net_payable_or_refund=b["total_tax"]-tds)
