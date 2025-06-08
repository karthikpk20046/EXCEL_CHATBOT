import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import re
import numpy as np
from datetime import datetime

st.set_page_config(page_title="Excel Chatbot", page_icon="📊", layout="wide")

# Preprocessing function
def preprocess_data(df):
    df.columns = [re.sub(r'[^a-zA-Z0-9]', '_', str(col).lower().strip()) for col in df.columns]
    for col in df.columns:
        if df[col].dtype == 'object':
            try:
                df[col] = pd.to_datetime(df[col])
            except:
                pass
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col].fillna('Unknown', inplace=True)
        elif pd.api.types.is_numeric_dtype(df[col]):
            df[col].fillna(df[col].median(), inplace=True)
    return df

# Visualization function
def generate_visualization(df, query):
    try:
        fig, ax = plt.subplots(figsize=(10, 5))
        query_lower = query.lower()

        num_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
        cat_cols = [col for col in df.columns if not pd.api.types.is_numeric_dtype(df[col]) and df[col].nunique() < 20]
        date_cols = [col for col in df.columns if pd.api.types.is_datetime64_any_dtype(df[col])]

        if any(word in query_lower for word in ["trend", "over time", "month", "year", "timeline"]) and date_cols:
            y_col = num_cols[0] if num_cols else None
            if y_col:
                df_sorted = df.sort_values(by=date_cols[0])
                sns.lineplot(x=df_sorted[date_cols[0]], y=df_sorted[y_col], ax=ax)
                ax.set_title(f"Trend of {y_col} over time")
                ax.set_xlabel(date_cols[0])
                ax.set_ylabel(y_col)
                plt.xticks(rotation=45)
                st.pyplot(fig)
                return

        elif any(word in query_lower for word in ["distribution", "histogram", "spread", "frequency"]):
            if num_cols:
                sns.histplot(df[num_cols[0]], bins=20, kde=True, ax=ax)
                ax.set_title(f"Distribution of {num_cols[0]}")
                ax.set_xlabel(num_cols[0])
                st.pyplot(fig)
                return

        elif any(word in query_lower for word in ["compare", "group", "by", "bar chart"]):
            if cat_cols and num_cols:
                cat_col = cat_cols[0]
                sns.barplot(x=cat_col, y=num_cols[0], data=df, estimator=np.mean, ax=ax)
                ax.set_title(f"Average {num_cols[0]} by {cat_col}")
                ax.set_xlabel(cat_col)
                ax.set_ylabel(f"Average {num_cols[0]}")
                plt.xticks(rotation=45)
                st.pyplot(fig)
                return

        elif "pie" in query_lower and cat_cols:
            cat_col = cat_cols[0]
            pie_data = df[cat_col].value_counts()
            fig, ax = plt.subplots()
            ax.pie(pie_data.values, labels=pie_data.index, autopct='%1.1f%%')
            ax.set_title(f"Pie chart of {cat_col}")
            st.pyplot(fig)
            return

        else:
            st.markdown("No matching chart. Displaying statistical summary:")
            st.dataframe(df.describe(include='all'))

    except Exception as e:
        st.error(f"❌ Visualization error: {str(e)}")

# Query interpretation without OpenAI
def basic_analysis(df, query):
    query = query.lower()
    try:
        if "average" in query or "mean" in query:
            for col in df.select_dtypes(include=np.number).columns:
                if col in query:
                    return f"The average of {col} is {df[col].mean():.2f}"

        elif "how many" in query or "count" in query:
            match = re.search(r'(under|below|less than)\s+(\d+)', query)
            if match:
                num = int(match.group(2))
                for col in df.select_dtypes(include=np.number).columns:
                    if col in query:
                        count = (df[col] < num).sum()
                        return f"There are {count} rows where {col} is less than {num}."

        elif "compare" in query or "group by" in query:
            cat_cols = [col for col in df.columns if df[col].nunique() < 20 and df[col].dtype == 'object']
            num_cols = df.select_dtypes(include=np.number).columns.tolist()
            if cat_cols and num_cols:
                result = df.groupby(cat_cols[0])[num_cols[0]].mean().reset_index()
                return result

        return "❌ Could not interpret your question. Try rephrasing."
    except Exception as e:
        return f"Error: {str(e)}"

# Main app logic
def main():
    st.title("📊 Excel Data Chatbot")
    st.markdown("Upload an Excel file and ask questions about your data in natural language.")

    uploaded_file = st.file_uploader("Upload Excel File", type=["xlsx", "xls"])

    if uploaded_file is not None:
        df = pd.read_excel(uploaded_file)
        df = preprocess_data(df)

        if df is not None:
            st.success("Data loaded successfully!")

            with st.expander("📅 Data Summary"):
                st.write(f"**Shape:** {df.shape[0]} rows x {df.shape[1]} columns")
                st.dataframe(df.head())

            st.subheader("📝 Ask a Question")
            query = st.text_input("E.g. 'What is the average income?', 'Compare balance by job', 'Show pie chart of education'")

            if query:
                with st.spinner("Analyzing..."):
                    result = basic_analysis(df, query)
                    st.markdown("### Result")
                    st.write(result)
                    generate_visualization(df, query)

    with st.expander("💡 Sample Questions"):
        st.markdown("""
        - What is the average income?
        - How many customers are under 30?
        - Compare loan amount by education
        - Show distribution of balance
        - Show trend of income over time
        - Show pie chart of job category
        """)

if __name__ == "__main__":
    main()
