import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import re

st.set_page_config(page_title="Excel Data Chatbot", page_icon="📊", layout="wide")

# Function to preprocess uploaded data
def preprocess_data(df):
    df.columns = [re.sub(r'[^a-zA-Z0-9]', '_', str(col).lower().strip()) for col in df.columns]
    for col in df.columns:
        if df[col].dtype == 'object':
            try:
                df[col] = pd.to_datetime(df[col])
            except:
                pass
        if df[col].dtype == 'object':
            df[col].fillna('Unknown', inplace=True)
        elif pd.api.types.is_numeric_dtype(df[col]):
            df[col].fillna(df[col].median(), inplace=True)
    return df

# Function to analyze query using pandas logic
def analyze_query(df, query):
    query = query.lower()
    try:
        if "average" in query or "mean" in query:
            for col in df.select_dtypes(include=np.number).columns:
                if col in query:
                    return f"The average of '{col}' is {df[col].mean():.2f}"

        if "how many" in query and "under" in query:
            for col in df.select_dtypes(include=np.number).columns:
                match = re.search(r"under\s+(\d+)", query)
                if match:
                    threshold = float(match.group(1))
                    count = df[df[col] < threshold].shape[0]
                    return f"There are {count} records where '{col}' is under {threshold}."

        if "compare" in query or "group by" in query or "by" in query:
            num_cols = df.select_dtypes(include=np.number).columns
            cat_cols = df.select_dtypes(exclude=np.number).columns
            if len(num_cols) > 0 and len(cat_cols) > 0:
                result = df.groupby(cat_cols[0])[num_cols[0]].mean().reset_index()
                return result.to_string(index=False)

        if "summary" in query or "describe" in query or "statistics" in query:
            return df.describe().to_string()

        return "🚫 Sorry, I couldn't understand your question. Please try again using keywords like 'average', 'under 30', 'compare by', or 'summary'."

    except Exception as e:
        return f"Error processing query: {str(e)}"

# Function to generate visualizations
def generate_visualization(df, query):
    try:
        fig, ax = plt.subplots(figsize=(10, 5))
        num_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
        date_cols = [col for col in df.columns if pd.api.types.is_datetime64_any_dtype(df[col])]
        cat_cols = [col for col in df.columns if df[col].nunique() < min(20, len(df)//2)]

        query_lower = query.lower()

        if any(word in query_lower for word in ["trend", "time", "month", "year"]) and date_cols:
            y_col = num_cols[0] if num_cols else None
            if y_col:
                sns.lineplot(data=df, x=date_cols[0], y=y_col, ax=ax)
                ax.set_title(f"Trend of {y_col} over time")
                ax.set_xlabel(date_cols[0])
                ax.set_ylabel(y_col)
                st.pyplot(fig)
                return

        if any(word in query_lower for word in ["distribution", "histogram", "spread"]):
            if num_cols:
                sns.histplot(df[num_cols[0]], kde=True, ax=ax)
                ax.set_title(f"Distribution of {num_cols[0]}")
                st.pyplot(fig)
                return

        if any(word in query_lower for word in ["compare", "group", "by", "versus", "vs"]):
            if num_cols and cat_cols:
                sns.barplot(data=df, x=cat_cols[0], y=num_cols[0], ax=ax, estimator=np.mean)
                ax.set_title(f"Comparison of {num_cols[0]} by {cat_cols[0]}")
                ax.set_xlabel(cat_cols[0])
                ax.set_ylabel(num_cols[0])
                plt.xticks(rotation=45)
                st.pyplot(fig)
                return

    except Exception as e:
        st.error(f"Visualization error: {str(e)}")

# Streamlit app
def main():
    st.title("📊 Excel Data Chatbot (No OpenAI API)")
    st.markdown("Upload an Excel file and ask questions about your data in natural language.")

    uploaded_file = st.file_uploader("Upload Excel File", type=["xlsx", "xls"])

    if uploaded_file:
        df = pd.read_excel(uploaded_file)
        df = preprocess_data(df)

        st.success("Data loaded successfully!")
        with st.expander("Preview Data"):
            st.dataframe(df.head())

        query = st.text_input("Ask a question about your data:")
        if query:
            st.subheader("Answer")
            result = analyze_query(df, query)
            st.text(result)
            generate_visualization(df, query)

        with st.expander("Example Questions"):
            st.markdown("""
            - What is the average income?
            - How many customers are under 30?
            - Compare sales by region
            - Show a bar chart of transaction count by job
            - Show income trend over time
            - Show distribution of age
            """)

if __name__ == "__main__":
    main()
