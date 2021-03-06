import React from "react"
import PropTypes from "prop-types"
import { graphql } from "gatsby"

import Layout from "../components/Layout"
import { MDXRenderer } from "gatsby-plugin-mdx"

export default function BlogTemplate({ data }) {
  const { frontmatter, body } = data.mdx

  return (
    <Layout fullMenu>
      <section id="wrapper">
        <header>
          <div className="inner">
            <h2>{frontmatter.title}</h2>
            <h3>{frontmatter.date}</h3>
            <p>{frontmatter.description}</p>
          </div>
        </header>

        <div className="wrapper">
          <div className="inner">
            <MDXRenderer>{body}</MDXRenderer>
          </div>
        </div>
      </section>
    </Layout>
  )
}

BlogTemplate.propTypes = {
  data: PropTypes.shape({
    mdx: PropTypes.shape({
      frontmatter: PropTypes.shape({
        title: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
      }).isRequired,
      body: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query($slug: String!) {
    mdx(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      body
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
      }
    }
  }
`
